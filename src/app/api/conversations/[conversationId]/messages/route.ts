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

      // Save message
      const message = await DirectMessage.create({
        conversationId,
        sender: req.user._id,
        content,
        readBy: [{ userId: req.user._id, readAt: new Date() }],
      });

      // Get recipient
      const recipientId = conversation.participants.find(
        (p: string) => String(p) !== String(req.user._id)
      );

      // Update conversation snapshot + increment recipient unread count atomically
      await Conversation.updateOne(
        { _id: conversationId },
        {
          $set: {
            lastMessage: {
              content: content.slice(0, 100),
              sentAt: message.createdAt,
              senderId: req.user._id,
            },
          },
          $inc: { [`unreadCount.${String(recipientId)}`]: 1 },
        }
      );

      // Create notification for recipient
      if (recipientId) {
        await Notification.create({
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
      }

      await message.populate("sender", "name avatar");

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
