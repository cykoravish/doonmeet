// Direct-message helpers shared by the Socket.IO server (src/lib/socket.ts)
// and the REST fallback route — so replies, profile cards and reactions are
// validated the same way on both paths.
//
// Keep this file free of any "next/…" import: the custom server loads it
// before Next.js has set up its runtime (see src/lib/rateLimitStore.ts).
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { DirectMessage } from "@/models/DirectMessage";
import { User } from "@/models/User";
import { Block } from "@/models/Block";
import {
  replyPreviewText,
  sharedProfileText,
  type DmMessageType,
  type DmReactionEntry,
  type DmReplyTo,
  type DmSharedProfile,
} from "@/lib/dmShared";

const isObjectId = (id: unknown): id is string => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

const MAX_CONTENT = 1000;

interface StoredFields {
  content: string;
  type: DmMessageType;
  replyTo: { messageId: mongoose.Types.ObjectId; senderId: mongoose.Types.ObjectId; preview: string } | null;
  sharedProfile: { userId: mongoose.Types.ObjectId; name: string; avatar: string | null } | null;
}

export type PrepareDmResult =
  | { ok: true; fields: StoredFields }
  | { ok: false; code: "EMPTY" | "PROFILE_UNAVAILABLE"; message: string };

/** A real, active, non-deleted member's public card — or null. */
export async function resolveSharedProfile(userId: string): Promise<DmSharedProfile | null> {
  if (!isObjectId(userId)) return null;
  await connectDB();
  const user = await User.findById(userId)
    .select("name avatar isActive isDeleted email passwordHash googleId")
    .lean<{
      _id: mongoose.Types.ObjectId;
      name: string;
      avatar?: string | null;
      isActive?: boolean;
      isDeleted?: boolean;
      email?: string | null;
      passwordHash?: string | null;
      googleId?: string | null;
    }>();
  // Same "is this a real account" rule as the members list (GET /api/users).
  const anonymized = !user?.email && !user?.passwordHash && !user?.googleId;
  if (!user || user.isActive === false || user.isDeleted || anonymized) return null;
  return { userId: String(user._id), name: user.name, avatar: user.avatar ?? null };
}

/**
 * Validates and builds everything stored for a new DM: the text, an optional
 * reply quote (only to a message in the same conversation) and an optional
 * shared profile card. The caller has already checked the sender is in the
 * conversation and not blocked.
 */
export async function prepareDmFields(
  conversationId: string,
  input: { content?: unknown; replyToId?: unknown; sharedProfileUserId?: unknown }
): Promise<PrepareDmResult> {
  await connectDB();

  let content: string;
  let type: DmMessageType = "text";
  let sharedProfile: StoredFields["sharedProfile"] = null;

  if (input.sharedProfileUserId != null && input.sharedProfileUserId !== "") {
    const profile = await resolveSharedProfile(String(input.sharedProfileUserId));
    if (!profile) {
      return { ok: false, code: "PROFILE_UNAVAILABLE", message: "That profile isn't available." };
    }
    type = "profile";
    sharedProfile = {
      userId: new mongoose.Types.ObjectId(profile.userId),
      name: profile.name,
      avatar: profile.avatar,
    };
    content = sharedProfileText(profile.name);
  } else {
    content = typeof input.content === "string" ? input.content.replace(/<[^>]*>/g, "").trim() : "";
    if (!content || content.length > MAX_CONTENT) {
      return { ok: false, code: "EMPTY", message: "Message can't be empty." };
    }
  }

  // A reply quote — only to a message in THIS conversation. If it's gone
  // (removed by a moderator), the message is still sent, just without the quote.
  let replyTo: StoredFields["replyTo"] = null;
  if (isObjectId(input.replyToId)) {
    const target = await DirectMessage.findOne({ _id: input.replyToId, conversationId })
      .select("sender content")
      .lean<{ _id: mongoose.Types.ObjectId; sender: mongoose.Types.ObjectId; content: string }>();
    if (target) {
      replyTo = { messageId: target._id, senderId: target.sender, preview: replyPreviewText(target.content) };
    }
  }

  return { ok: true, fields: { content, type, replyTo, sharedProfile } };
}

/** The live (socket) shape of a DM — the same fields the history API returns. */
export function toDmPayload(
  message: {
    _id: unknown;
    content: string;
    type?: DmMessageType;
    replyTo?: StoredFields["replyTo"];
    sharedProfile?: StoredFields["sharedProfile"];
    createdAt: Date;
  },
  conversationId: string,
  sender: { _id: string; name: string; avatar: string | null }
) {
  const replyTo: DmReplyTo | null = message.replyTo
    ? {
        messageId: String(message.replyTo.messageId),
        senderId: String(message.replyTo.senderId),
        preview: message.replyTo.preview,
      }
    : null;
  const sharedProfile: DmSharedProfile | null = message.sharedProfile
    ? {
        userId: String(message.sharedProfile.userId),
        name: message.sharedProfile.name,
        avatar: message.sharedProfile.avatar ?? null,
      }
    : null;
  return {
    _id: String(message._id),
    conversationId,
    content: message.content,
    type: message.type ?? "text",
    replyTo,
    sharedProfile,
    reactions: [] as DmReactionEntry[],
    createdAt: message.createdAt,
    sender,
  };
}

/**
 * Sets (or with emoji = null, removes) this person's reaction on a message in
 * one atomic update, so double taps can never leave two reactions from the
 * same person. Returns the message's reactions afterwards, or null if the
 * message isn't in this conversation.
 */
export async function setDmReaction(
  conversationId: string,
  messageId: string,
  userId: string,
  emoji: string | null
): Promise<DmReactionEntry[] | null> {
  if (!isObjectId(conversationId) || !isObjectId(messageId) || !isObjectId(userId)) return null;
  await connectDB();
  const me = new mongoose.Types.ObjectId(userId);
  const others = {
    $filter: { input: { $ifNull: ["$reactions", []] }, cond: { $ne: ["$$this.userId", me] } },
  };
  const next = emoji ? { $concatArrays: [others, [{ userId: me, emoji }]] } : others;

  const doc = await DirectMessage.findOneAndUpdate(
    { _id: messageId, conversationId },
    [{ $set: { reactions: next } }],
    { updatePipeline: true, returnDocument: "after", projection: { reactions: 1 }, timestamps: false }
  ).lean<{ reactions?: { userId: mongoose.Types.ObjectId; emoji: string }[] }>();

  if (!doc) return null;
  return (doc.reactions ?? []).map((r) => ({ userId: String(r.userId), emoji: r.emoji }));
}

export interface PresenceState {
  isOnline: boolean;
  lastSeenAt: string | null;
}

/**
 * Current online state of these people, as seen by `viewerId`. Anyone with a
 * block between them and the viewer (either way) is left out — they shouldn't
 * be able to watch each other come online.
 */
export async function getPresenceFor(
  viewerId: string,
  userIds: string[]
): Promise<{ visible: Record<string, PresenceState>; visibleIds: string[] }> {
  const ids = [...new Set(userIds.filter(isObjectId))].filter((id) => id !== viewerId).slice(0, 100);
  if (ids.length === 0 || !isObjectId(viewerId)) return { visible: {}, visibleIds: [] };
  await connectDB();

  const [blocks, users] = await Promise.all([
    Block.find({
      $or: [
        { blocker: viewerId, blocked: { $in: ids } },
        { blocked: viewerId, blocker: { $in: ids } },
      ],
    })
      .select("blocker blocked")
      .lean<{ blocker: mongoose.Types.ObjectId; blocked: mongoose.Types.ObjectId }[]>(),
    User.find({ _id: { $in: ids } })
      .select("isOnline lastSeenAt isDeleted")
      .lean<{ _id: mongoose.Types.ObjectId; isOnline?: boolean; lastSeenAt?: Date | null; isDeleted?: boolean }[]>(),
  ]);

  const hidden = new Set<string>();
  for (const b of blocks) {
    hidden.add(String(b.blocker) === viewerId ? String(b.blocked) : String(b.blocker));
  }

  const visible: Record<string, PresenceState> = {};
  for (const u of users) {
    const id = String(u._id);
    if (hidden.has(id) || u.isDeleted) continue;
    visible[id] = {
      isOnline: !!u.isOnline,
      lastSeenAt: u.lastSeenAt ? new Date(u.lastSeenAt).toISOString() : null,
    };
  }
  return { visible, visibleIds: Object.keys(visible) };
}
