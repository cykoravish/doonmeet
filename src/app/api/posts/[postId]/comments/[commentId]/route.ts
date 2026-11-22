// GET    — one comment or reply (used to open a thread from a notification)
// PATCH  — edit your own comment/reply
// DELETE — delete your own comment/reply, or any comment on YOUR post.
//          Deleting a top-level comment removes its whole thread.
// ============================================================
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { PostComment } from "@/models/PostComment";
import { Notification } from "@/models/Notification";
import { withGuestAllowed, requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { commentLimiter, generalLimiter } from "@/middleware/rateLimit";
import { updatePostCommentSchema } from "@/validations/postComment";
import { loadComment } from "@/lib/postComments";

const isObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

type Params = { params: Promise<Record<string, string>> };

async function readIds(params: Params["params"]) {
  const { postId, commentId } = await params;
  return isObjectId(postId) && isObjectId(commentId) ? { postId, commentId } : null;
}

const invalidIds = () => NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
const gone = () =>
  NextResponse.json({ success: false, code: "COMMENT_GONE", message: "This comment was deleted." }, { status: 404 });

export const GET = withGuestAllowed(async (req: AuthenticatedRequest, { params }: Params) => {
  const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
  if (limited) return limited;
  const ids = await readIds(params);
  if (!ids) return invalidIds();

  try {
    await connectDB();
    const comment = await loadComment(ids.postId, ids.commentId);
    if (!comment) return gone();
    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error("[GET /posts/[id]/comments/[cid]] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

export const PATCH = requireVerified(async (req: AuthenticatedRequest, { params }: Params) => {
  const userId = String(req.user._id);
  const limited = commentLimiter(req, userId);
  if (limited) return limited;
  const ids = await readIds(params);
  if (!ids) return invalidIds();

  const result = await validateBody(req, updatePostCommentSchema);
  if (result instanceof NextResponse) return result;
  const { content } = result.data as { content: string };

  try {
    await connectDB();
    const existing = await PostComment.findOne({ _id: ids.commentId, post: ids.postId })
      .select("author content")
      .lean<{ author: mongoose.Types.ObjectId; content: string }>();
    if (!existing) return gone();
    if (String(existing.author) !== userId) {
      return NextResponse.json({ success: false, message: "You can only edit your own comments." }, { status: 403 });
    }

    // Unchanged text → nothing to save, and no "edited" label.
    if (existing.content !== content) {
      await PostComment.updateOne({ _id: ids.commentId }, { $set: { content, editedAt: new Date() } });
    }

    const comment = await loadComment(ids.postId, ids.commentId);
    return NextResponse.json({ success: true, message: "Comment updated", comment });
  } catch (error) {
    console.error("[PATCH /posts/[id]/comments/[cid]] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

export const DELETE = requireVerified(async (req: AuthenticatedRequest, { params }: Params) => {
  const userId = String(req.user._id);
  const limited = commentLimiter(req, userId);
  if (limited) return limited;
  const ids = await readIds(params);
  if (!ids) return invalidIds();

  try {
    await connectDB();
    const [comment, post] = await Promise.all([
      PostComment.findOne({ _id: ids.commentId, post: ids.postId })
        .select("author parentId")
        .lean<{ _id: mongoose.Types.ObjectId; author: mongoose.Types.ObjectId; parentId: mongoose.Types.ObjectId | null }>(),
      Post.findById(ids.postId).select("author").lean<{ author: mongoose.Types.ObjectId }>(),
    ]);
    if (!comment || !post) return gone();

    const isAuthor = String(comment.author) === userId;
    const isPostOwner = String(post.author) === userId;
    if (!isAuthor && !isPostOwner) {
      return NextResponse.json(
        { success: false, message: "You can only delete your own comments, or comments on your post." },
        { status: 403 }
      );
    }

    let removedIds: mongoose.Types.ObjectId[];
    let removed: number;
    if (comment.parentId) {
      // A reply: remove just it and shrink its thread's counter.
      const { deletedCount } = await PostComment.deleteOne({ _id: comment._id });
      if (!deletedCount) return gone();
      removedIds = [comment._id];
      removed = deletedCount;
      await PostComment.updateOne({ _id: comment.parentId, replyCount: { $gt: 0 } }, { $inc: { replyCount: -1 } });
    } else {
      // A top-level comment: the whole thread goes with it.
      const { deletedCount } = await PostComment.deleteOne({ _id: comment._id });
      if (!deletedCount) return gone();
      const replies = await PostComment.find({ parentId: comment._id }).select("_id").lean<{ _id: mongoose.Types.ObjectId }[]>();
      removedIds = [comment._id, ...replies.map((r) => r._id)];
      // parentId filter (not just the ids) also catches a reply posted a
      // split second ago, after the find above.
      const replyResult = await PostComment.deleteMany({ parentId: comment._id });
      removed = deletedCount + replyResult.deletedCount;
    }

    // Never let the counter go below zero (pipeline update = one atomic step;
    // Mongoose 9 needs updatePipeline for it).
    await Post.updateOne(
      { _id: ids.postId },
      [{ $set: { commentCount: { $max: [0, { $subtract: [{ $ifNull: ["$commentCount", 0] }, removed] }] } } }],
      { updatePipeline: true, timestamps: false }
    );
    // Their notifications would only lead to a missing comment now.
    await Notification.deleteMany({ refModel: "PostComment", refId: { $in: removedIds } }).catch(() => {});

    return NextResponse.json({ success: true, message: "Comment deleted", removed });
  } catch (error) {
    console.error("[DELETE /posts/[id]/comments/[cid]] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
