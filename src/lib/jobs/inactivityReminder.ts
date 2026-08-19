// Daily job — emails users who've gone quiet for a while, nudging them
// back. Scheduled from server.ts via node-cron.
// ============================================================
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { sendInactivityReminderEmail } from "@/lib/email";

const INACTIVITY_THRESHOLD_DAYS = 15;
const RESEND_COOLDOWN_DAYS = 30; // don't re-nag the same user more than once/month

// Resend's free tier is capped at 100 emails/day *total* (shared with
// verification, password-reset, and DM emails). Cap how many inactivity
// emails this job can send per run so it can never eat the whole day's
// quota and starve real transactional emails.
const MAX_EMAILS_PER_RUN = 40;

export async function runInactivityReminderJob(): Promise<void> {
  console.log("[inactivity-job] Starting run...");

  try {
    await connectDB();

    const now = Date.now();
    const inactiveSince = new Date(now - INACTIVITY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
    const cooldownCutoff = new Date(now - RESEND_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

    const candidates = await User.find({
      isGuest: false,
      isActive: true,
      isVerified: true,
      email: { $ne: null },
      isOnline: false,
      lastSeenAt: { $lt: inactiveSince },
      $or: [{ lastInactivityEmailAt: null }, { lastInactivityEmailAt: { $lt: cooldownCutoff } }],
    })
      .select("_id name email")
      .limit(MAX_EMAILS_PER_RUN)
      .lean();

    console.log(`[inactivity-job] Found ${candidates.length} eligible user(s) this run.`);

    for (const user of candidates) {
      if (!user.email) continue;

      try {
        // Stamp first (atomically, per-user) so a crash mid-loop can't
        // resend to users already processed earlier in this run.
        await User.updateOne({ _id: user._id }, { $set: { lastInactivityEmailAt: new Date() } });
        await sendInactivityReminderEmail(user.email, user.name, String(user._id));
      } catch (err) {
        console.error(`[inactivity-job] Failed for user ${user._id}:`, err);
      }
    }

    console.log("[inactivity-job] Run complete.");
  } catch (err) {
    console.error("[inactivity-job] Run failed:", err);
  }
}
