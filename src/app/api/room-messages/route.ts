import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getChatMutedUntil } from "@/lib/safety";
import { RoomMessage } from "@/models/RoomMessage";
import { prepareRoomReply, resolveRoomReplies } from "@/lib/roomChat";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { withGuestAllowed } from "@/middleware/auth";
import { validateBody, validateQuery } from "@/middleware/validate";
import { roomChatLimiter, generalLimiter } from "@/middleware/rateLimit";
import { sendRoomMessageSchema, getRoomMessagesSchema } from "@/validations/roomMessage";

// -------------------------------------------------------
// GET /api/room-messages
// Accessible by everyone (guests + users)
// -------------------------------------------------------
export const GET = withGuestAllowed(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
  if (limited) return limited;

  const queryResult = validateQuery(req, getRoomMessagesSchema);
  if (queryResult instanceof NextResponse) return queryResult;
  const { cursor, limit } = queryResult.data;

  try {
    await connectDB();

    // Build query — if cursor provided, fetch messages older than that message
    const query: Record<string, unknown> = {};
    if (cursor) {
      // Validate cursor is a valid ObjectId
      if (!/^[a-f\d]{24}$/i.test(cursor)) {
        return NextResponse.json({ success: false, message: "Invalid cursor" }, { status: 400 });
      }
      query._id = { $lt: cursor }; // messages older than cursor
    }

    const messages = await RoomMessage.find(query)
      .sort({ _id: -1 }) // latest first
      .limit(limit)
      .populate("sender", "name avatar role") // only safe public fields
      .lean();

    // Reverse so frontend renders oldest → newest. (.reverse() mutates in
    // place, so read the oldest id from `ordered[0]` — not the last element,
    // which after reversing is the NEWEST message and made "load earlier"
    // return the same page again.)
    const ordered = messages.reverse();

    // Next cursor = oldest message id in this batch (for loading more)
    const nextCursor = ordered.length === limit ? String(ordered[0]._id) : null;

    // Reply quotes: current names, and no text for quotes of removed messages.
    const withReplies = await resolveRoomReplies(ordered);

    return NextResponse.json(
      {
        success: true,
        messages: withReplies,
        nextCursor, // null means no more messages
        hasMore: !!nextCursor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /room-messages] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

// -------------------------------------------------------
// POST /api/room-messages
// -------------------------------------------------------
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  // Strict rate limit for chat — prevents flooding
  const limited = roomChatLimiter(req, String(req.user._id));
  if (limited) return limited;

  const result = await validateBody(req, sendRoomMessageSchema);
  if (result instanceof NextResponse) return result;
  const { content, replyToId } = result.data as { content: string; replyToId?: string };

  try {
    await connectDB();

    // Auto-muted after several reports — same rule as the socket handler.
    const mutedUntil = await getChatMutedUntil(String(req.user._id));
    if (mutedUntil) {
      return NextResponse.json(
        {
          success: false,
          code: "CHAT_MUTED",
          until: mutedUntil.toISOString(),
          message: "You're temporarily muted from the public chat.",
        },
        { status: 403 }
      );
    }

    // Same reply rules as the socket path (src/lib/roomChat.ts).
    const reply = await prepareRoomReply(replyToId);

    // Create message
    const message = await RoomMessage.create({
      sender: req.user._id,
      content,
      replyTo: reply?.stored ?? null,
    });

    // Populate sender for response
    await message.populate("sender", "name avatar role");

    return NextResponse.json(
      {
        success: true,
        message: { ...message.toObject(), replyTo: reply?.payload ?? null },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /room-messages] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
});
