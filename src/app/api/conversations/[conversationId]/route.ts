// GET — get a single conversation with participant info
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Conversation } from "@/models/Conversation";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

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

    try {
      await connectDB();

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: req.user._id, // ensure user is a participant
      })
        .populate("participants", "name avatar lastSeenAt isActive")
        .lean();

      if (!conversation) {
        return NextResponse.json(
          { success: false, message: "Conversation not found." },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, conversation }, { status: 200 });
    } catch (error) {
      console.error("[GET /conversations/[id]] Error:", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      );
    }
  }
);
