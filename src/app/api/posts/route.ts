// GET  — list posts (public feed, paginated, optionally filtered by author)
// POST — create a new post, optional image upload (logged in users only, not guests)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import {
  withGuestAllowed,
  requireVerified,
  AuthenticatedRequest,
} from "@/middleware/auth";
import { validateBody, validateQuery } from "@/middleware/validate";
import { generalLimiter, postLimiter } from "@/middleware/rateLimit";
import { createPostSchema, getPostsSchema } from "@/validations/post";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// GET /api/posts
export const GET = withGuestAllowed(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
  if (limited) return limited;

  const queryResult = validateQuery(req, getPostsSchema);
  if (queryResult instanceof NextResponse) return queryResult;
  const { cursor, limit, author } = queryResult.data;

  try {
    await connectDB();

    const query: Record<string, unknown> = {};
    if (author) query.author = author;

    if (cursor) {
      if (!/^[a-f\d]{24}$/i.test(cursor)) {
        return NextResponse.json({ success: false, message: "Invalid cursor" }, { status: 400 });
      }
      query._id = { $lt: cursor };
    }

    const posts = await Post.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate("author", "name avatar")
      .select("-imagePublicId -__v")
      .lean();

    const nextCursor = posts.length === limit ? String(posts[posts.length - 1]._id) : null;

    return NextResponse.json(
      {
        success: true,
        posts,
        nextCursor,
        hasMore: !!nextCursor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /posts] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

// POST /api/posts
// requireVerified = withAuth + blocks guests
export const POST = requireVerified(async (req: AuthenticatedRequest) => {
  const limited = postLimiter(req, String(req.user._id));
  if (limited) return limited;

  try {
    const formData = await req.formData();
    const content = formData.get("content");

    const result = await validateBody(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }) as unknown as NextRequest,
      createPostSchema
    );
    if (result instanceof NextResponse) return result;

    await connectDB();

    let imageUrl: string | null = null;
    let imagePublicId: string | null = null;

    const imageFile = formData.get("image") as File | null;
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

      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    const post = await Post.create({
      author: req.user._id,
      content: result.data.content,
      image: imageUrl,
      imagePublicId,
    });

    await post.populate("author", "name avatar");

    return NextResponse.json(
      { success: true, message: "Post created successfully", post },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /posts] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
