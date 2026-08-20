// Send emails via Resend
// ============================================================
import { Resend } from "resend";
import { connectDB } from "@/lib/db";
import { EmailLog, EmailType } from "@/models/EmailLog";
import { User } from "@/models/User";

const DM_EMAIL_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://doonmeet.in";
const FROM = "DoonMeet <ravish@doonmeet.in>";

// Wraps resend.emails.send with an EmailLog entry (sent or failed) so every
// automated email is auditable from the admin dashboard. Never throws —
// callers already treat email sending as fire-and-forget.
async function sendAndLog(params: {
  to: string;
  subject: string;
  html: string;
  type: EmailType;
  recipientId?: string | null;
}): Promise<void> {
  const { to, subject, html, type, recipientId } = params;
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    await connectDB();
    await EmailLog.create({
      recipient: recipientId ?? null,
      recipientEmail: to,
      type,
      subject,
      status: "sent",
    });
  } catch (err) {
    console.error(`[email] Failed to send "${type}" to ${to}:`, err);
    try {
      await connectDB();
      await EmailLog.create({
        recipient: recipientId ?? null,
        recipientEmail: to,
        type,
        subject,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    } catch (logErr) {
      console.error("[email] Failed to write EmailLog entry:", logErr);
    }
    throw err; // let callers keep their own .catch() logging if they want it
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const link = `${APP_URL}/verify-email?token=${token}`;
  await sendAndLog({
    to: email,
    type: "verification",
    subject: "Verify your DoonMeet account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#2d6a4f">Welcome to DoonMeet 👋</h2>
        <p>Click the button below to verify your email address. This link expires in <strong>24 hours</strong>.</p>
        <a href="${link}"
          style="display:inline-block;background:#2d6a4f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Verify Email
        </a>
        <p style="color:#888;margin-top:24px;font-size:13px">If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const link = `${APP_URL}/reset-password?token=${token}`;
  await sendAndLog({
    to: email,
    type: "password_reset",
    subject: "Reset your DoonMeet password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#2d6a4f">Reset your password</h2>
        <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${link}"
          style="display:inline-block;background:#2d6a4f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#888;margin-top:24px;font-size:13px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

// Sent when a genuinely offline user receives their first unread DM in a
// conversation (throttled — see maybeSendDmNotificationEmail in socket.ts).
export async function sendDmNotificationEmail(
  email: string,
  recipientName: string,
  senderName: string,
  preview: string,
  recipientId: string
): Promise<void> {
  const link = `${APP_URL}/chat`;
  await sendAndLog({
    to: email,
    type: "new_dm",
    subject: `${senderName} sent you a message on DoonMeet`,
    recipientId,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#2d6a4f">New message 💬</h2>
        <p>Hi ${recipientName}, <strong>${senderName}</strong> just sent you a message on DoonMeet:</p>
        <p style="background:#f5f5f5;border-radius:8px;padding:12px 16px;color:#333;font-style:italic">
          "${preview}"
        </p>
        <a href="${link}"
          style="display:inline-block;background:#2d6a4f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Reply on DoonMeet
        </a>
        <p style="color:#888;margin-top:24px;font-size:13px">You're getting this because you were offline when the message arrived. You won't get another email for this conversation for a little while.</p>
      </div>
    `,
  });
}

// Decides whether a "new DM" email should go out, and sends it if so.
// Rules (see docs/plan discussion):
//   - Recipient must be genuinely offline (no live socket connection at all —
//     not just "not looking at this conversation").
//   - At most one DM email per recipient per hour, regardless of how many
//     different conversations/senders are messaging them, to avoid spam.
// The cooldown check + stamp is done as one atomic findOneAndUpdate so two
// messages arriving at the same moment can't both slip through.
export async function maybeSendDmNotificationEmail(
  recipientId: string,
  senderName: string,
  preview: string
): Promise<void> {
  try {
    await connectDB();
    const cutoff = new Date(Date.now() - DM_EMAIL_COOLDOWN_MS);

    const recipient = await User.findOneAndUpdate(
      {
        _id: recipientId,
        isOnline: false,
        email: { $ne: null },
        $or: [{ lastDmEmailAt: null }, { lastDmEmailAt: { $lt: cutoff } }],
      },
      { $set: { lastDmEmailAt: new Date() } },
      { new: false } // we don't need the updated doc, just need to know it matched
    )
      .select("name email")
      .lean();

    if (!recipient?.email) return; // offline+cooldown conditions weren't met, or no email on file

    await sendDmNotificationEmail(
      recipient.email,
      recipient.name,
      senderName,
      preview,
      recipientId
    );
  } catch (err) {
    console.error("[email] maybeSendDmNotificationEmail failed:", err);
  }
}

// Sent to users who've been inactive for a while, to bring them back.
export async function sendInactivityReminderEmail(
  email: string,
  recipientName: string,
  recipientId: string
): Promise<void> {
  await sendAndLog({
    to: email,
    type: "inactivity_reminder",
    subject: "We miss you on DoonMeet 👋",
    recipientId,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#2d6a4f">We miss you, ${recipientName} 👋</h2>
        <p>It's been a while since you checked in on DoonMeet. There are new people, communities, and events happening around Dehradun right now.</p>
        <a href="${APP_URL}"
          style="display:inline-block;background:#2d6a4f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          See what's new
        </a>
        <p style="color:#888;margin-top:24px;font-size:13px">You're receiving this because your DoonMeet account has been inactive for a while.</p>
      </div>
    `,
  });
}
