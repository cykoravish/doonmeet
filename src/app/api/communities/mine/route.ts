import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { CommunityMember } from "@/models/CommunityMember";
import { requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

export const GET = requireVerified(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  try {
    await connectDB();

    const memberships = await CommunityMember.find({ user: req.user._id })
      .populate("community", "name slug")
      .lean();

    const communities = memberships
      .map((m) => m.community)
      .filter(Boolean);

    return NextResponse.json({ success: true, communities }, { status: 200 });
  } catch (error) {
    console.error("[GET /communities/mine] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});