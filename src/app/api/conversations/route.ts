// GET  — get all conversations for logged in user (inbox)
// POST — start a new conversation with another user
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Conversation } from "@/models/Conversation";
import { User } from "@/models/User";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { generalLimiter } from "@/middleware/rateLimit";
import { createConversationSchema } from "@/validations/directMessage";

// GET /api/conversations
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  try {
    await connectDB();

    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .sort({ updatedAt: -1 }) // most recent first
      .limit(50) // max 50 conversations in inbox
      .populate("participants", "name avatar lastSeenAt isActive")
      .lean();

    // Shape response — add unread count for current user
    const userId = String(req.user._id);
    const shaped = conversations.map((conv) => ({
      ...conv,
      unreadCount: conv.unreadCount?.get
        ? (conv.unreadCount.get(userId) ?? 0)
        : ((conv.unreadCount as Record<string, number>)?.[userId] ?? 0),
      // Remove the other participant's unread count from response
      otherParticipant: conv.participants.find(
        (p: { _id: { toString(): string } }) => p._id.toString() !== userId
      ),
    }));

    return NextResponse.json({ success: true, conversations: shaped }, { status: 200 });
  } catch (error) {
    console.error("[GET /conversations] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

// POST /api/conversations
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  const result = await validateBody(req, createConversationSchema);
  if (result instanceof NextResponse) return result;
  const { recipientId } = result.data as { recipientId: string };

  // Cannot start conversation with yourself
  if (recipientId === String(req.user._id)) {
    return NextResponse.json(
      { success: false, message: "You cannot start a conversation with yourself." },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // Check recipient exists, is active, and hasn't deleted their account —
    // two-layer check, see GET /api/users for full reasoning.
    const recipient = await User.findById(recipientId)
      .select("_id name avatar isActive isDeleted email passwordHash googleId")
      .lean();

    const isAnonymized = !recipient?.email && !recipient?.passwordHash && !recipient?.googleId;
    if (!recipient || !recipient.isActive || recipient.isDeleted || isAnonymized) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    // Sort participants so [A,B] === [B,A] — deterministic pair key
    const participants = [String(req.user._id), recipientId].sort();
    const participantsKey = participants.join("_");

    let conversation;
    try {
      // Find existing or create new — upsert pattern
      conversation = await Conversation.findOneAndUpdate(
        { participantsKey },
        {
          $setOnInsert: {
            participants,
            participantsKey,
            unreadCount: {},
            lastMessage: { content: null, sentAt: null, senderId: null },
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      ).populate("participants", "name avatar lastSeenAt");
    } catch (err: unknown) {
      // Two simultaneous requests both tried to create this pair's first
      // conversation — the other one won the race. Just fetch it.
      if (err && typeof err === "object" && "code" in err && err.code === 11000) {
        conversation = await Conversation.findOne({ participantsKey }).populate(
          "participants",
          "name avatar lastSeenAt"
        );
      } else {
        throw err;
      }
    }

    if (!conversation) {
      return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        conversation,
        isNew: !conversation.lastMessage.sentAt, // tells frontend if this is a fresh conversation
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /conversations] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
