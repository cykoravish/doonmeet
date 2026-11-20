// Report / block / auto-mute logic — shared by the REST routes and the
// socket server so the rules are enforced identically everywhere.
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Block } from "@/models/Block";
import { Report, type ReportContext, type ReportReason } from "@/models/Report";
import { User } from "@/models/User";
import { RoomMessage } from "@/models/RoomMessage";
import { DirectMessage } from "@/models/DirectMessage";
import { Conversation } from "@/models/Conversation";
import { Post } from "@/models/Post";
import { sendUserReportEmail } from "@/lib/email";

// Auto-mute: this many DIFFERENT people reporting the same user within the
// window mutes them from the public chat for MUTE_DURATION_MS.
export const AUTO_MUTE_REPORTERS = 3;
const AUTO_MUTE_WINDOW_MS = 24 * 60 * 60 * 1000;
const MUTE_DURATION_MS = 24 * 60 * 60 * 1000;

// Same reporter → same person: at most one report per this window (stops
// one angry user from tripping the auto-mute alone or spamming the inbox).
const DUPLICATE_REPORT_WINDOW_MS = 6 * 60 * 60 * 1000;

const isObjectId = (id: unknown): id is string => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

// -------------------------------------------------------
// Blocks
// -------------------------------------------------------

/** True if either user has blocked the other. DMs are closed in both directions. */
export async function isBlockedEitherWay(userA: string, userB: string): Promise<boolean> {
  await connectDB();
  const hit = await Block.exists({
    $or: [
      { blocker: userA, blocked: userB },
      { blocker: userB, blocked: userA },
    ],
  });
  return !!hit;
}

export async function getBlockStatus(me: string, other: string) {
  await connectDB();
  const [byMe, byThem] = await Promise.all([
    Block.exists({ blocker: me, blocked: other }),
    Block.exists({ blocker: other, blocked: me }),
  ]);
  return { blockedByMe: !!byMe, blockedMe: !!byThem };
}

export async function blockUser(me: string, other: string): Promise<void> {
  await connectDB();
  // Upsert so double-taps / retries are harmless.
  await Block.updateOne(
    { blocker: me, blocked: other },
    { $setOnInsert: { blocker: me, blocked: other } },
    { upsert: true }
  );
}

export async function unblockUser(me: string, other: string): Promise<void> {
  await connectDB();
  await Block.deleteOne({ blocker: me, blocked: other });
}

// -------------------------------------------------------
// Public chat mute
// -------------------------------------------------------

/** Returns the mute end time if the user is currently muted, else null. */
export async function getChatMutedUntil(userId: string): Promise<Date | null> {
  await connectDB();
  const user = await User.findById(userId).select("chatMutedUntil").lean<{ chatMutedUntil?: Date | null }>();
  const until = user?.chatMutedUntil ? new Date(user.chatMutedUntil) : null;
  return until && until.getTime() > Date.now() ? until : null;
}

// -------------------------------------------------------
// Reports
// -------------------------------------------------------

interface CreateReportInput {
  reporterId: string;
  reporterName: string;
  reportedId: string;
  context: ReportContext;
  refId?: string | null;
  reason: ReportReason;
  details?: string;
}

export type CreateReportResult =
  | { ok: true; autoMuted: boolean }
  | { ok: false; status: number; message: string };

/**
 * Looks up the reported content server-side (never trust a client-sent
 * copy), stores the report, applies the auto-mute rule, and emails the admin.
 */
export async function createReport(input: CreateReportInput): Promise<CreateReportResult> {
  const { reporterId, reportedId, context, reason } = input;
  const details = (input.details ?? "").slice(0, 500);
  const refId = isObjectId(input.refId) ? input.refId : null;

  if (reporterId === reportedId) {
    return { ok: false, status: 400, message: "You can't report yourself." };
  }

  await connectDB();

  const reported = await User.findById(reportedId).select("name isDeleted").lean<{ name: string; isDeleted?: boolean }>();
  if (!reported || reported.isDeleted) {
    return { ok: false, status: 404, message: "User not found." };
  }

  const duplicate = await Report.exists({
    reporter: reporterId,
    reported: reportedId,
    createdAt: { $gte: new Date(Date.now() - DUPLICATE_REPORT_WINDOW_MS) },
  });
  if (duplicate) {
    return { ok: false, status: 429, message: "You've already reported this person recently — we're on it." };
  }

  // Snapshot the reported content, and make sure it really belongs to the
  // reported user (and, for DMs, that the reporter was in the conversation).
  let snapshot: string | null = null;
  if (refId) {
    if (context === "room_message") {
      const msg = await RoomMessage.findOne({ _id: refId, sender: reportedId }).select("content").lean<{ content: string }>();
      snapshot = msg?.content ?? null;
    } else if (context === "direct_message") {
      const msg = await DirectMessage.findOne({ _id: refId, sender: reportedId })
        .select("content conversationId")
        .lean<{ content: string; conversationId: mongoose.Types.ObjectId }>();
      // Only accept it if the reporter was actually in that conversation.
      const inConversation = msg
        ? await Conversation.exists({ _id: msg.conversationId, participants: reporterId })
        : null;
      snapshot = msg && inConversation ? msg.content : null;
    } else if (context === "post") {
      const post = await Post.findOne({ _id: refId, author: reportedId }).select("content").lean<{ content: string }>();
      snapshot = post?.content ?? null;
    }
  }

  await Report.create({
    reporter: reporterId,
    reported: reportedId,
    context,
    refId: snapshot ? refId : null,
    snapshot: snapshot ? snapshot.slice(0, 1000) : null,
    reason,
    details,
  });

  // Auto-mute: enough different people reported them recently.
  const reporters = await Report.distinct("reporter", {
    reported: reportedId,
    createdAt: { $gte: new Date(Date.now() - AUTO_MUTE_WINDOW_MS) },
  });
  let autoMuted = false;
  if (reporters.length >= AUTO_MUTE_REPORTERS) {
    const until = new Date(Date.now() + MUTE_DURATION_MS);
    const res = await User.updateOne(
      // Only extend/set if not already muted past this point.
      { _id: reportedId, $or: [{ chatMutedUntil: null }, { chatMutedUntil: { $lt: until } }] },
      { $set: { chatMutedUntil: until } }
    );
    autoMuted = res.modifiedCount > 0;
  }

  // Fire-and-forget — a failed email must not fail the report.
  sendUserReportEmail({
    reporterName: input.reporterName,
    reporterId,
    reportedName: reported.name,
    reportedId,
    context,
    reason,
    details,
    snapshot,
    distinctReporters24h: reporters.length,
    autoMuted,
  }).catch((err) => console.error("[safety] report email failed:", err));

  return { ok: true, autoMuted };
}
