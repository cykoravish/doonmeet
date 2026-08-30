// Send emails via Resend
// ============================================================
import { Resend } from "resend";
import { connectDB } from "@/lib/db";
import { EmailLog, EmailType } from "@/models/EmailLog";
import { User } from "@/models/User";

const DM_EMAIL_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const GLOBAL_CHAT_EMAIL_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://doonmeet.in";
const FROM = "DoonMeet <ravish@doonmeet.in>";
// Where "someone messaged the global chat" alerts go. Overridable via env
// without a code change if the inbox to watch ever changes.
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? "ravish@doonmeet.in";

// In-memory cooldown gate for the global-chat alert (see
// maybeSendGlobalChatNotificationEmail below). Deliberately not persisted
// to the DB — this app runs as a single long-lived Node process (server.ts),
// so a module-level timestamp is enough and avoids a DB write on every
// single chat message just to check a throttle.
let lastGlobalChatEmailAt = 0;

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

export async function sendVerificationEmail(email: string, otp: string): Promise<void> {
  await sendAndLog({
    to: email,
    type: "verification",
    subject: `${otp} is your DoonMeet verification code`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#2d6a4f">Welcome to DoonMeet 👋</h2>
        <p>Enter this code to verify your email address. It expires in <strong>5 minutes</strong>.</p>
        <div style="display:inline-block;background:#f0f5f1;color:#2d6a4f;padding:16px 28px;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:8px;margin:12px 0">
          ${otp}
        </div>
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

// Sent when someone comments on a user's post — but only if that user is
// currently offline, mirroring the DM email behaviour so active users
// aren't spammed with an email for something they'll see in-app instantly.
export async function sendPostCommentNotificationEmail(
  email: string,
  recipientName: string,
  commenterName: string,
  preview: string,
  postId: string,
  recipientId: string
): Promise<void> {
  const link = `${APP_URL}/posts/${postId}`;
  await sendAndLog({
    to: email,
    type: "post_comment",
    subject: `${commenterName} commented on your post`,
    recipientId,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#2d6a4f">New comment on your post 📝</h2>
        <p>Hi ${recipientName}, <strong>${commenterName}</strong> just commented on your post on DoonMeet:</p>
        <p style="background:#f5f5f5;border-radius:8px;padding:12px 16px;color:#333;font-style:italic">
          "${preview}"
        </p>
        <a href="${link}"
          style="display:inline-block;background:#2d6a4f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          View Post
        </a>
        <p style="color:#888;margin-top:24px;font-size:13px">You're getting this because you were offline when the comment came in.</p>
      </div>
    `,
  });
}

// Decides whether a "post comment" email should go out, and sends it if so.
// Only fires for genuinely offline post owners (no live socket connection),
// same spirit as maybeSendDmNotificationEmail but without a cooldown since
// post comments are naturally much less frequent than DMs.
export async function maybeSendPostCommentEmail(
  recipientId: string,
  commenterName: string,
  preview: string,
  postId: string
): Promise<void> {
  try {
    await connectDB();
    const recipient = await User.findOne({
      _id: recipientId,
      isOnline: false,
      email: { $ne: null },
    })
      .select("name email")
      .lean();

    if (!recipient?.email) return; // online, or no email on file

    await sendPostCommentNotificationEmail(
      recipient.email,
      recipient.name,
      commenterName,
      preview,
      postId,
      recipientId
    );
  } catch (err) {
    console.error("[email] maybeSendPostCommentEmail failed:", err);
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

// Admin alert — fires when anyone posts in the public global chat room.
// Unlike the DM/comment emails above, this isn't gated on the recipient
// being offline (the admin isn't a chat participant); it's purely
// throttled — see maybeSendGlobalChatNotificationEmail.
async function sendGlobalChatNotificationEmail(senderName: string, preview: string): Promise<void> {
  const link = `${APP_URL}/chat`;
  await sendAndLog({
    to: ADMIN_EMAIL,
    type: "global_chat_message",
    subject: `New global chat message from ${senderName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#2d6a4f">New message in global chat 💬</h2>
        <p><strong>${senderName}</strong> just posted:</p>
        <p style="background:#f5f5f5;border-radius:8px;padding:12px 16px;color:#333;font-style:italic">
          "${preview}"
        </p>
        <a href="${link}"
          style="display:inline-block;background:#2d6a4f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Open Global Chat
        </a>
        <p style="color:#888;margin-top:24px;font-size:13px">You're getting this because you're subscribed to global chat alerts. To cut down on volume, you'll get at most one of these every few minutes even if multiple messages come in.</p>
      </div>
    `,
  });
}

// Throttled entry point — call this on every global chat message. Sends at
// most one admin email per GLOBAL_CHAT_EMAIL_COOLDOWN_MS window, regardless
// of how many messages/senders come in during that window. Never throws —
// this is fire-and-forget from the socket handler.
export async function maybeSendGlobalChatNotificationEmail(
  senderName: string,
  content: string
): Promise<void> {
  try {
    const now = Date.now();
    if (now - lastGlobalChatEmailAt < GLOBAL_CHAT_EMAIL_COOLDOWN_MS) return;
    lastGlobalChatEmailAt = now;

    const preview = content.length > 200 ? `${content.slice(0, 197)}...` : content;
    await sendGlobalChatNotificationEmail(senderName, preview);
  } catch (err) {
    console.error("[email] maybeSendGlobalChatNotificationEmail failed:", err);
  }
}
