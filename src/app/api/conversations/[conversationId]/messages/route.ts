// GET  — fetch messages with cursor pagination
// POST — send a message (REST fallback if socket fails)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DirectMessage } from "@/models/DirectMessage";
import { Conversation } from "@/models/Conversation";
import { Notification } from "@/models/Notification";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody, validateQuery } from "@/middleware/validate";
import { dmLimiter, generalLimiter } from "@/middleware/rateLimit";
import { sendDirectMessageSchema, getMessagesSchema } from "@/validations/directMessage";
import { getIO, isUserActiveInRoom } from "@/lib/socket";
import { maybeSendDmNotificationEmail } from "@/lib/email";

// GET /api/conversations/[conversationId]/messages
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user._id));
    if (limited) return limited;

    if (req.user.isGuest) {
      return NextResponse.json(
        { success: false, message: "Guests cannot access direct messages." },
        { status: 403 }
      );
    }

    const { conversationId } = await params;

    if (!/^[a-f\d]{24}$/i.test(conversationId)) {
      return NextResponse.json(
        { success: false, message: "Invalid conversation ID" },
        { status: 400 }
      );
    }

    const queryResult = validateQuery(req, getMessagesSchema);
    if (queryResult instanceof NextResponse) return queryResult;
    const { cursor, limit } = queryResult.data;

    try {
      await connectDB();

      // Verify user is a participant — security check
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: req.user._id,
      }).lean();

      if (!conversation) {
        return NextResponse.json(
          { success: false, message: "Conversation not found." },
          { status: 404 }
        );
      }

      // Cursor pagination — fetch messages older than cursor
      const query: Record<string, unknown> = { conversationId };
      if (cursor) {
        if (!/^[a-f\d]{24}$/i.test(cursor)) {
          return NextResponse.json({ success: false, message: "Invalid cursor" }, { status: 400 });
        }
        query._id = { $lt: cursor };
      }

      const messages = await DirectMessage.find(query)
        .sort({ _id: -1 })
        .limit(limit)
        .populate("sender", "name avatar")
        .lean();

      const ordered = messages.reverse(); // oldest → newest
      const nextCursor =
        messages.length === limit ? String(messages[messages.length - 1]._id) : null;

      // Mark fetched messages as read
      const now = new Date();
      const userId = String(req.user._id);

      await DirectMessage.updateMany(
        {
          conversationId,
          sender: { $ne: req.user._id },
          "readBy.userId": { $ne: req.user._id },
        },
        { $push: { readBy: { userId: req.user._id, readAt: now } } }
      );

      // Reset unread count for current user
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { [`unreadCount.${userId}`]: 0 } }
      );

      // Keep the notification bell consistent with what's actually been
      // read: clear unread new_dm notifications from this conversation's
      // other participant.
      const otherParticipantId = (conversation.participants as unknown[]).find(
        (p) => String(p) !== userId
      );
      if (otherParticipantId) {
        const { modifiedCount } = await Notification.updateMany(
          {
            recipient: req.user._id,
            type: "new_dm",
            "actor.userId": otherParticipantId,
            isRead: false,
          },
          { $set: { isRead: true } }
        );
        if (modifiedCount > 0) {
          try {
            getIO().to(`user:${userId}`).emit("notification:read_bulk", { count: modifiedCount });
          } catch {
            // Socket server not reachable from this process — safe to ignore,
            // the notification is still correctly marked read in the DB.
          }
        }
      }

      return NextResponse.json(
        {
          success: true,
          messages: ordered,
          nextCursor,
          hasMore: !!nextCursor,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("[GET /conversations/[id]/messages] Error:", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      );
    }
  }
);

// POST /api/conversations/[conversationId]/messages
// REST fallback — used when socket is unavailable
export const POST = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = dmLimiter(req, String(req.user._id));
    if (limited) return limited;

    if (req.user.isGuest) {
      return NextResponse.json(
        { success: false, message: "Guests cannot send direct messages. Please sign up." },
        { status: 403 }
      );
    }

    const { conversationId } = await params;

    if (!/^[a-f\d]{24}$/i.test(conversationId)) {
      return NextResponse.json(
        { success: false, message: "Invalid conversation ID" },
        { status: 400 }
      );
    }

    const result = await validateBody(req, sendDirectMessageSchema);
    if (result instanceof NextResponse) return result;
    const { content } = result.data as { content: string };

    try {
      await connectDB();

      // Verify sender is a participant
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: req.user._id,
      });

      if (!conversation) {
        return NextResponse.json(
          { success: false, message: "Conversation not found." },
          { status: 404 }
        );
      }

      // Get recipient
      const recipientId = conversation.participants.find(
        (p: string) => String(p) !== String(req.user._id)
      );

      // Is the recipient already looking at this exact conversation right
      // now (their own socket has it joined)? If so, treat this message as
      // instantly read for them, same as the socket dm:message handler
      // does — otherwise the unread badge/notification would be wrong the
      // moment they step away.
      let recipientActive = false;
      try {
        if (recipientId) {
          recipientActive = isUserActiveInRoom(getIO(), `dm:${conversationId}`, String(recipientId));
        }
      } catch {
        // Socket server not reachable from this process — fall back to
        // treating the recipient as not-active (safe default: they'll get
        // a normal unread message + notification).
      }

      const readBy = [{ userId: req.user._id, readAt: new Date() }];
      if (recipientActive && recipientId) {
        readBy.push({ userId: recipientId, readAt: new Date() });
      }

      // Save message
      const message = await DirectMessage.create({
        conversationId,
        sender: req.user._id,
        content,
        readBy,
      });

      // Update conversation snapshot + increment recipient unread count
      // atomically — but only if they're not already seeing it live.
      const conversationUpdate: Record<string, unknown> = {
        $set: {
          lastMessage: {
            content: content.slice(0, 100),
            sentAt: message.createdAt,
            senderId: req.user._id,
          },
        },
      };
      if (!recipientActive) {
        conversationUpdate.$inc = { [`unreadCount.${String(recipientId)}`]: 1 };
      }
      await Conversation.updateOne({ _id: conversationId }, conversationUpdate);

      await message.populate("sender", "name avatar");

      // Broadcast over the socket too — this REST endpoint only runs when a
      // client's socket connection is down, but the recipient's might still
      // be up (e.g. their tab is open, only the sender's connection dropped).
      try {
        const io = getIO();
        const dmRoom = `dm:${conversationId}`;
        io.to(dmRoom).emit("dm:message", {
          _id: message._id,
          conversationId,
          content: message.content,
          createdAt: message.createdAt,
          sender: message.sender,
        });
        if (recipientActive && recipientId) {
          io.to(dmRoom).emit("dm:read", {
            conversationId,
            readBy: String(recipientId),
            readAt: readBy[1].readAt,
          });
        }
      } catch {
        // Socket server not reachable from this process — the message is
        // still saved; the recipient will see it next time they fetch.
      }

      // Create notification for recipient — unless they're already looking
      // at this conversation live (avoids a redundant/noisy notification).
      if (recipientId && !recipientActive) {
        const notification = await Notification.create({
          recipient: recipientId,
          type: "new_dm",
          refModel: "DirectMessage",
          refId: message._id,
          preview: content.slice(0, 100),
          actor: {
            userId: req.user._id,
            name: req.user.name,
            avatar: req.user.avatar,
          },
        });

        try {
          getIO()
            .to(`user:${String(recipientId)}`)
            .emit("notification:new", {
              _id: notification._id,
              type: "new_dm",
              preview: notification.preview,
              actor: notification.actor,
              createdAt: notification.createdAt,
              isRead: false,
            });
        } catch {
          // Ignore — recipient will still see it next time they load notifications.
        }

        maybeSendDmNotificationEmail(String(recipientId), req.user.name, content).catch(() => {
          // Errors are already logged inside the helper.
        });
      }

      return NextResponse.json({ success: true, message }, { status: 201 });
    } catch (error) {
      console.error("[POST /conversations/[id]/messages] Error:", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      );
    }
  }
);
