import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { RoomMessage } from "@/models/RoomMessage";
import { User } from "@/models/User";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { withGuestAllowed } from "@/middleware/auth";
import { validateBody, validateQuery } from "@/middleware/validate";
import { roomChatLimiter, generalLimiter } from "@/middleware/rateLimit";
import { sendRoomMessageSchema, getRoomMessagesSchema } from "@/validations/roomMessage";

const GUEST_MESSAGE_LIMIT = 5;

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
      .populate("sender", "name avatar isGuest role") // only safe public fields
      .lean();

    // Reverse so frontend renders oldest → newest
    const ordered = messages.reverse();

    // Next cursor = oldest message id in this batch (for loading more)
    const nextCursor = messages.length === limit ? String(messages[messages.length - 1]._id) : null;

    return NextResponse.json(
      {
        success: true,
        messages: ordered,
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
// Both guests and users can send — but guests have a limit
// -------------------------------------------------------
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  // Strict rate limit for chat — prevents flooding
  const limited = roomChatLimiter(req, String(req.user._id));
  if (limited) return limited;

  // -------------------------------------------------------
  // Guest limit check
  // -------------------------------------------------------
  if (req.user.isGuest) {
    if (req.user.guestMessageCount >= GUEST_MESSAGE_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          message: `Guest users can only send ${GUEST_MESSAGE_LIMIT} messages. Sign up to chat without limits!`,
          code: "GUEST_LIMIT_REACHED",
          limit: GUEST_MESSAGE_LIMIT,
        },
        { status: 403 }
      );
    }
  }

  const result = await validateBody(req, sendRoomMessageSchema);
  if (result instanceof NextResponse) return result;
  const { content } = result.data as { content: string };

  try {
    await connectDB();

    // Create message
    const message = await RoomMessage.create({
      sender: req.user._id,
      content,
      isGuest: req.user.isGuest,
    });

    // Increment guest message count atomically
    if (req.user.isGuest) {
      await User.updateOne({ _id: req.user._id }, { $inc: { guestMessageCount: 1 } });
    }

    // Populate sender for response
    await message.populate("sender", "name avatar isGuest role");

    return NextResponse.json(
      {
        success: true,
        message: message,
        // Tell guest how many messages they have left
        ...(req.user.isGuest && {
          remaining: GUEST_MESSAGE_LIMIT - (req.user.guestMessageCount + 1),
        }),
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
