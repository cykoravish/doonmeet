import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { CommunityMember } from "@/models/CommunityMember";
import { CommunityPost } from "@/models/CommunityPost";
import { CommunityPostComment } from "@/models/CommunityPostComment";
import { Community } from "@/models/Community";
import { withGuestAllowed, requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { generalLimiter } from "@/middleware/rateLimit";
import { createCommentSchema } from "@/validations/eventComment";

// GET — anyone can view comments
export const GET = withGuestAllowed(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
    if (limited) return limited;

    const { postId } = await params;

    try {
      await connectDB();

      const comments = await CommunityPostComment.find({ post: postId })
        .sort({ createdAt: 1 })
        .limit(100)
        .populate("author", "name avatar")
        .lean();

      return NextResponse.json({ success: true, comments }, { status: 200 });
    } catch (error) {
      console.error("[GET .../comments] Error:", error);
      return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
    }
  }
);

// POST — only community members can comment
export const POST = requireVerified(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user._id));
    if (limited) return limited;

    const { slug, postId } = await params;

    const result = await validateBody(req, createCommentSchema);
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
          { success: false, message: "Join this community to comment." },
          { status: 403 }
        );
      }

      const post = await CommunityPost.findById(postId).select("_id");
      if (!post) {
        return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });
      }

      const comment = await CommunityPostComment.create({
        post: postId,
        author: req.user._id,
        content,
      });
      await comment.populate("author", "name avatar");
      await CommunityPost.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

      return NextResponse.json({ success: true, comment }, { status: 201 });
    } catch (error) {
      console.error("[POST .../comments] Error:", error);
      return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
    }
  }
);