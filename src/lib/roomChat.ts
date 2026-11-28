// Public-chat reply helpers shared by the Socket.IO server (src/lib/socket.ts)
// and the REST route — so a reply is validated and shown the same way on
// both paths.
//
// Keep this file free of any "next/…" import: the custom server loads it
// before Next.js has set up its runtime (see src/lib/rateLimitStore.ts).
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { RoomMessage, type IRoomReply } from "@/models/RoomMessage";
import { User } from "@/models/User";
import { replyPreviewText } from "@/lib/dmShared";
import type { RoomReplyTo } from "@/lib/roomShared";

const isObjectId = (id: unknown): id is string =>
  typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

/** Shown for a quoted person whose account no longer exists at all. */
const UNKNOWN_SENDER = "Deleted User";

/**
 * The quote for a new reply: what's stored with the message and what's sent
 * to everyone. Null when it isn't a reply, or the original is gone (removed
 * by a moderator meanwhile) — the message is then sent without a quote.
 */
export async function prepareRoomReply(
  replyToId: unknown
): Promise<{ stored: IRoomReply; payload: RoomReplyTo } | null> {
  if (!isObjectId(replyToId)) return null;
  await connectDB();

  const target = await RoomMessage.findById(replyToId)
    .select("sender content")
    .lean<{ _id: mongoose.Types.ObjectId; sender: mongoose.Types.ObjectId; content: string }>();
  if (!target) return null;

  const sender = await User.findById(target.sender).select("name").lean<{ name?: string }>();
  const preview = replyPreviewText(target.content);
  return {
    stored: { messageId: target._id, senderId: target.sender, preview },
    payload: {
      messageId: String(target._id),
      senderId: String(target.sender),
      senderName: sender?.name || UNKNOWN_SENDER,
      preview,
    },
  };
}

type WithStoredReply = { replyTo?: IRoomReply | null };

/**
 * Turns the stored quotes on a page of history into what the chat shows:
 * the quoted person's current name, and "removed" (with no text) for quotes
 * whose original message has since been deleted. Two queries per page.
 */
export async function resolveRoomReplies<T extends WithStoredReply>(
  messages: T[]
): Promise<(Omit<T, "replyTo"> & { replyTo: RoomReplyTo | null })[]> {
  const quoted = messages.flatMap((m) => (m.replyTo ? [m.replyTo] : []));
  if (quoted.length === 0) return messages.map((m) => ({ ...m, replyTo: null }));

  const [stillThere, senders] = await Promise.all([
    RoomMessage.find({ _id: { $in: quoted.map((q) => q.messageId) } })
      .select("_id")
      .lean<{ _id: mongoose.Types.ObjectId }[]>(),
    User.find({ _id: { $in: quoted.map((q) => q.senderId) } })
      .select("name")
      .lean<{ _id: mongoose.Types.ObjectId; name?: string }[]>(),
  ]);
  const alive = new Set(stillThere.map((d) => String(d._id)));
  const names = new Map(senders.map((u) => [String(u._id), u.name || UNKNOWN_SENDER]));

  return messages.map((m) => {
    const q = m.replyTo;
    if (!q) return { ...m, replyTo: null };
    const removed = !alive.has(String(q.messageId));
    return {
      ...m,
      replyTo: {
        messageId: String(q.messageId),
        senderId: String(q.senderId),
        senderName: names.get(String(q.senderId)) ?? UNKNOWN_SENDER,
        preview: removed ? "" : q.preview,
        ...(removed ? { removed: true } : {}),
      },
    };
  });
}
