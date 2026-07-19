import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Community } from "@/models/Community";
import { CommunityMember } from "@/models/CommunityMember";
import { withGuestAllowed, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

export const GET = withGuestAllowed(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
    if (limited) return limited;

    const { slug } = await params;

    try {
      await connectDB();

      const community = await Community.findOne({ slug }).select("_id");
      if (!community) {
        return NextResponse.json({ success: false, message: "Community not found." }, { status: 404 });
      }

      const members = await CommunityMember.find({ community: community._id })
        .sort({ joinedAt: -1 })
        .limit(50)
        .populate("user", "name avatar")
        .lean();

      const isMember = req.user
        ? members.some((m) => String((m.user as { _id: unknown })._id) === String(req.user!._id)) ||
          (await CommunityMember.exists({ community: community._id, user: req.user._id }))
        : false;

      return NextResponse.json({ success: true, members, isMember: !!isMember }, { status: 200 });
    } catch (error) {
      console.error("[GET /communities/[slug]/members] Error:", error);
      return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
    }
  }
);