// GET    /api/users/:userId/block — block status between me and this user
// POST   /api/users/:userId/block — block them (closes DMs both ways)
// DELETE /api/users/:userId/block — unblock
// ============================================================
import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { blockUser, getBlockStatus, unblockUser } from "@/lib/safety";

type Ctx = { params: Promise<Record<string, string>> };

/** The target user id, or an error response to return as-is. */
async function resolveTarget(req: AuthenticatedRequest, ctx: Ctx): Promise<string | NextResponse> {
  const { userId } = await ctx.params;
  if (!/^[a-f\d]{24}$/i.test(userId)) {
    return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 });
  }
  if (userId === String(req.user._id)) {
    return NextResponse.json({ success: false, message: "You can't block yourself." }, { status: 400 });
  }
  return userId;
}

export const GET = withAuth(async (req: AuthenticatedRequest, ctx: Ctx) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  const target = await resolveTarget(req, ctx);
  if (target instanceof NextResponse) return target;

  try {
    const status = await getBlockStatus(String(req.user._id), target);
    return NextResponse.json({ success: true, ...status });
  } catch (error) {
    console.error("[GET /users/:id/block] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest, ctx: Ctx) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  const target = await resolveTarget(req, ctx);
  if (target instanceof NextResponse) return target;

  try {
    await connectDB();
    const exists = await User.exists({ _id: target });
    if (!exists) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }
    await blockUser(String(req.user._id), target);
    return NextResponse.json({ success: true, blockedByMe: true });
  } catch (error) {
    console.error("[POST /users/:id/block] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest, ctx: Ctx) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  const target = await resolveTarget(req, ctx);
  if (target instanceof NextResponse) return target;

  try {
    await unblockUser(String(req.user._id), target);
    return NextResponse.json({ success: true, blockedByMe: false });
  } catch (error) {
    console.error("[DELETE /users/:id/block] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
