// POST   — ❤️ a post   (idempotent: liking twice counts once)
// DELETE — remove your ❤️
// Both answer with the post's fresh { liked, likeCount }.
// ============================================================
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { PostLike } from "@/models/PostLike";
import { Notification } from "@/models/Notification";
import { requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { likeLimiter } from "@/middleware/rateLimit";

const isObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);
type Params = { params: Promise<Record<string, string>> };

async function currentCount(postId: string): Promise<number> {
  const post = await Post.findById(postId).select("likeCount").lean<{ likeCount?: number }>();
  return Math.max(0, post?.likeCount ?? 0);
}

const isDuplicateKey = (err: unknown) => (err as { code?: number })?.code === 11000;

export const POST = requireVerified(async (req: AuthenticatedRequest, { params }: Params) => {
  const userId = String(req.user._id);
  const limited = likeLimiter(req, userId);
  if (limited) return limited;

  const { postId } = await params;
  if (!isObjectId(postId)) {
    return NextResponse.json({ success: false, message: "Invalid post ID" }, { status: 400 });
  }

  try {
    await connectDB();
    const post = await Post.findById(postId).select("author").lean<{ _id: mongoose.Types.ObjectId; author: mongoose.Types.ObjectId }>();
    if (!post) return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });

    let isNewLike = false;
    try {
      const res = await PostLike.updateOne(
        { post: postId, user: userId },
        { $setOnInsert: { post: postId, user: userId } },
        { upsert: true }
      );
      isNewLike = res.upsertedCount === 1;
    } catch (err) {
      // Two taps racing: the other request inserted it — already liked.
      if (!isDuplicateKey(err)) throw err;
    }

    if (isNewLike) {
      await Post.updateOne({ _id: postId }, { $inc: { likeCount: 1 } }, { timestamps: false });

      // In-app only (no push/email) — likes are frequent. One per person per
      // post, even if they unlike and like again.
      const ownerId = String(post.author);
      if (ownerId !== userId) {
        await Notification.updateOne(
          { recipient: ownerId, type: "post_like", refModel: "Post", refId: postId, "actor.userId": userId },
          {
            $setOnInsert: {
              recipient: ownerId,
              type: "post_like",
              refModel: "Post",
              refId: postId,
              url: `/posts/${postId}`,
              actor: { userId, name: req.user.name, avatar: req.user.avatar ?? null },
              isRead: false,
            },
          },
          { upsert: true }
        ).catch((err) => console.error("[POST /posts/[id]/like] notify failed:", err));
      }
    }

    return NextResponse.json({ success: true, liked: true, likeCount: await currentCount(postId) });
  } catch (error) {
    console.error("[POST /posts/[id]/like] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

export const DELETE = requireVerified(async (req: AuthenticatedRequest, { params }: Params) => {
  const userId = String(req.user._id);
  const limited = likeLimiter(req, userId);
  if (limited) return limited;

  const { postId } = await params;
  if (!isObjectId(postId)) {
    return NextResponse.json({ success: false, message: "Invalid post ID" }, { status: 400 });
  }

  try {
    await connectDB();
    const { deletedCount } = await PostLike.deleteOne({ post: postId, user: userId });
    if (deletedCount) {
      // Pipeline update (Mongoose 9 needs updatePipeline) so it can't go below 0.
      await Post.updateOne(
        { _id: postId },
        [{ $set: { likeCount: { $max: [0, { $subtract: [{ $ifNull: ["$likeCount", 0] }, 1] }] } } }],
        { updatePipeline: true, timestamps: false }
      );
      // Take back the "liked your post" notification if it's still unread.
      await Notification.deleteOne({ type: "post_like", refId: postId, "actor.userId": userId, isRead: false }).catch(
        (err) => console.error("[DELETE /posts/[id]/like] notification cleanup failed:", err)
      );
    }
    return NextResponse.json({ success: true, liked: false, likeCount: await currentCount(postId) });
  } catch (error) {
    console.error("[DELETE /posts/[id]/like] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
