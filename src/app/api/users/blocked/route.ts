// GET /api/users/blocked — people I've blocked (for the settings list)
// ============================================================
import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";
import { connectDB } from "@/lib/db";
import { Block } from "@/models/Block";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  try {
    await connectDB();
    const blocks = await Block.find({ blocker: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("blocked", "name avatar")
      .lean<{ _id: unknown; createdAt: Date; blocked: { _id: unknown; name: string; avatar: string | null } | null }[]>();

    const users = blocks
      .filter((b) => b.blocked)
      .map((b) => ({
        _id: String(b.blocked!._id),
        name: b.blocked!.name,
        avatar: b.blocked!.avatar ?? null,
        blockedAt: b.createdAt,
      }));

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("[GET /users/blocked] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
