// GET    — get a single post (public)
// PATCH  — edit own post (author only)
// DELETE — delete own post (author only)
// ============================================================
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { PostComment } from "@/models/PostComment";
import { withGuestAllowed, requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter, postLimiter } from "@/middleware/rateLimit";
import { updatePostSchema } from "@/validations/post";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

// PATCH /api/posts/[postId]
export const PATCH = requireVerified(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = postLimiter(req, String(req.user._id));
    if (limited) return limited;

    const { postId } = await params;

    if (!/^[a-f\d]{24}$/i.test(postId)) {
      return NextResponse.json({ success: false, message: "Invalid post ID" }, { status: 400 });
    }

    try {
      await connectDB();

      const post = await Post.findById(postId).select("author image imagePublicId");
      if (!post) {
        return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });
      }

      if (String(post.author) !== String(req.user._id)) {
        return NextResponse.json(
          { success: false, message: "You can only edit your own posts." },
          { status: 403 }
        );
      }

      const formData = await req.formData();
      const parsed = updatePostSchema.safeParse({
        content: formData.get("content"),
        removeImage: formData.get("removeImage"),
      });

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input" },
          { status: 400 }
        );
      }

      const { content, removeImage } = parsed.data;
      const imageFile = formData.get("image") as File | null;

      let newImageUrl = post.image;
      let newImagePublicId = post.imagePublicId;
      const oldPublicId = post.imagePublicId;

      if (imageFile && imageFile.size > 0) {
        if (!ALLOWED_TYPES.includes(imageFile.type)) {
          return NextResponse.json(
            { success: false, message: "Only JPEG, PNG and WebP images are allowed" },
            { status: 400 }
          );
        }
        if (imageFile.size > MAX_IMAGE_SIZE) {
          return NextResponse.json(
            { success: false, message: "Image must be smaller than 5MB" },
            { status: 400 }
          );
        }

        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
          (resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                {
                  folder: "doonmeet/posts",
                  transformation: [
                    { width: 1200, height: 1200, crop: "limit" },
                    { quality: "auto", fetch_format: "auto" },
                  ],
                },
                (error, uploaded) => {
                  if (error || !uploaded) return reject(error);
                  resolve(uploaded);
                }
              )
              .end(buffer);
          }
        );

        newImageUrl = uploadResult.secure_url;
        newImagePublicId = uploadResult.public_id;
      } else if (removeImage) {
        newImageUrl = null;
        newImagePublicId = null;
      }

      post.content = content;
      post.image = newImageUrl;
      post.imagePublicId = newImagePublicId;
      await post.save();

      // Clean up the old Cloudinary asset once the new one is safely saved,
      // but only if it actually changed (new upload or explicit removal).
      if (oldPublicId && oldPublicId !== newImagePublicId) {
        cloudinary.uploader.destroy(oldPublicId).catch(() => {});
      }

      await post.populate("author", "name avatar");

      return NextResponse.json(
        { success: true, message: "Post updated.", post },
        { status: 200 }
      );
    } catch (error) {
      console.error("[PATCH /posts/[id]] Error:", error);
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
