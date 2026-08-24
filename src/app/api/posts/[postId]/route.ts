// GET    — get a single post (public)
// DELETE — delete own post (author only)
// ============================================================
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { PostComment } from "@/models/PostComment";
import { withGuestAllowed, requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET /api/posts/[postId]
export const GET = withGuestAllowed(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
    if (limited) return limited;

    const { postId } = await params;

    if (!/^[a-f\d]{24}$/i.test(postId)) {
      return NextResponse.json({ success: false, message: "Invalid post ID" }, { status: 400 });
    }

    try {
      await connectDB();

      const post = await Post.findById(postId)
        .populate("author", "name avatar")
        .select("-imagePublicId -__v")
        .lean();

      if (!post) {
        return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });
      }

      return NextResponse.json({ success: true, post }, { status: 200 });
    } catch (error) {
      console.error("[GET /posts/[id]] Error:", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/posts/[postId]
export const DELETE = requireVerified(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user._id));
    if (limited) return limited;

    const { postId } = await params;

    if (!/^[a-f\d]{24}$/i.test(postId)) {
      return NextResponse.json({ success: false, message: "Invalid post ID" }, { status: 400 });
    }

    try {
      await connectDB();

      const post = await Post.findById(postId).select("author imagePublicId");
      if (!post) {
        return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });
      }

      if (String(post.author) !== String(req.user._id)) {
        return NextResponse.json(
          { success: false, message: "You can only delete your own posts." },
          { status: 403 }
        );
      }

      await Promise.all([
        Post.deleteOne({ _id: postId }),
        PostComment.deleteMany({ post: postId }),
        post.imagePublicId
          ? cloudinary.uploader.destroy(post.imagePublicId).catch(() => {})
          : Promise.resolve(),
      ]);

      return NextResponse.json({ success: true, message: "Post deleted." }, { status: 200 });
    } catch (error) {
      console.error("[DELETE /posts/[id]] Error:", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      );
    }
  }
);
