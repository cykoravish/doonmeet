import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Community } from "@/models/Community";
import { CommunityMember } from "@/models/CommunityMember";
import { requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

export const POST = requireVerified(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user._id));
    if (limited) return limited;

    const { slug } = await params;

    try {
      await connectDB();

      const community = await Community.findOne({ slug, isActive: true }).select("_id");
      if (!community) {
        return NextResponse.json({ success: false, message: "Community not found." }, { status: 404 });
      }

      const existing = await CommunityMember.findOne({
        community: community._id,
        user: req.user._id,
      });

      if (existing) {
        return NextResponse.json({ success: true, message: "Already a member." }, { status: 200 });
      }

      await CommunityMember.create({ community: community._id, user: req.user._id });
      await Community.findByIdAndUpdate(community._id, { $inc: { memberCount: 1 } });

      return NextResponse.json({ success: true, message: "Joined community!" }, { status: 200 });
    } catch (error) {
      console.error("[POST /communities/[slug]/join] Error:", error);
      return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
    }
  }
);