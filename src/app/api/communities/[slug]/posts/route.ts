import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Community } from "@/models/Community";
import { CommunityMember } from "@/models/CommunityMember";
import { CommunityPost } from "@/models/CommunityPost";
import { withGuestAllowed, requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { generalLimiter } from "@/middleware/rateLimit";
import { createCommunityPostSchema } from "@/validations/community";

// GET — anyone can view the discussion feed
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

      const posts = await CommunityPost.find({ community: community._id })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate("author", "name avatar")
        .lean();

      return NextResponse.json({ success: true, posts }, { status: 200 });
    } catch (error) {
      console.error("[GET /communities/[slug]/posts] Error:", error);
      return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
    }
  }
);

// POST — only community members can post
export const POST = requireVerified(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user._id));
    if (limited) return limited;

    const { slug } = await params;

    const result = await validateBody(req, createCommunityPostSchema);
    if (result instanceof NextResponse) return result;
    const { content } = result.data as { content: string };

    try {
      await connectDB();

      const community = await Community.findOne({ slug }).select("_id");
      if (!community) {
        return NextResponse.json({ success: false, message: "Community not found." }, { status: 404 });
      }

      const isMember = await CommunityMember.exists({ community: community._id, user: req.user._id });
      if (!isMember) {
        return NextResponse.json(
          { success: false, message: "Join this community to post in the discussion." },
          { status: 403 }
        );
      }

      const post = await CommunityPost.create({
        community: community._id,
        author: req.user._id,
        content,
      });
      await post.populate("author", "name avatar");

      return NextResponse.json({ success: true, post }, { status: 201 });
    } catch (error) {
      console.error("[POST /communities/[slug]/posts] Error:", error);
      return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
    }
  }
);