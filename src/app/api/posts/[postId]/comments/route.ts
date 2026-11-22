// GET  — top-level comments of a post, newest page first (guests + users)
// POST — add a comment, or reply to any comment/reply (logged-in users)
// ============================================================
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { PostComment } from "@/models/PostComment";
import { Notification } from "@/models/Notification";
import { withGuestAllowed, requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody, validateQuery } from "@/middleware/validate";
import { commentLimiter, generalLimiter } from "@/middleware/rateLimit";
import { createPostCommentSchema, commentPageSchema } from "@/validations/postComment";
import { getTopLevelComments, loadComment } from "@/lib/postComments";
import { sendPushToUser } from "@/lib/push";
import { maybeSendPostCommentEmail } from "@/lib/email";

const isObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

type Params = { params: Promise<Record<string, string>> };

// GET /api/posts/[postId]/comments?cursor=<oldest _id shown>
// Returns the newest `limit` top-level comments older than the cursor, in
// reading order (oldest → newest). nextCursor pages further back in time.
export const GET = withGuestAllowed(async (req: AuthenticatedRequest, { params }: Params) => {
  const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
  if (limited) return limited;

  const { postId } = await params;
  if (!isObjectId(postId)) {
    return NextResponse.json({ success: false, message: "Invalid post ID" }, { status: 400 });
  }

  const queryResult = validateQuery(req, commentPageSchema);
  if (queryResult instanceof NextResponse) return queryResult;
  const { cursor, limit } = queryResult.data;

  try {
    await connectDB();

    if (!(await Post.exists({ _id: postId }))) {
      return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });
    }

    const { comments, nextCursor } = await getTopLevelComments(postId, { cursor, limit });

    return NextResponse.json({ success: true, comments, nextCursor, hasMore: !!nextCursor });
  } catch (error) {
    console.error("[GET /posts/[id]/comments] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

// POST /api/posts/[postId]/comments   { content, parentId? }
// parentId = the comment being replied to — a top-level comment or any reply.
export const POST = requireVerified(async (req: AuthenticatedRequest, { params }: Params) => {
  const userId = String(req.user._id);
  const limited = commentLimiter(req, userId);
  if (limited) return limited;

  const { postId } = await params;
  if (!isObjectId(postId)) {
    return NextResponse.json({ success: false, message: "Invalid post ID" }, { status: 400 });
  }

  const result = await validateBody(req, createPostCommentSchema);
  if (result instanceof NextResponse) return result;
  const { content, parentId: replyToId } = result.data as { content: string; parentId?: string | null };

  try {
    await connectDB();

    const post = await Post.findById(postId).select("author").lean<{ _id: mongoose.Types.ObjectId; author: mongoose.Types.ObjectId }>();
    if (!post) {
      return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });
    }

    // Replying: find the comment being answered and its thread's top comment.
    let thread: { rootId: mongoose.Types.ObjectId; target: { _id: mongoose.Types.ObjectId; author: mongoose.Types.ObjectId } } | null = null;
    if (replyToId) {
      const target = await PostComment.findOne({ _id: replyToId, post: postId })
        .select("author parentId")
        .lean<{ _id: mongoose.Types.ObjectId; author: mongoose.Types.ObjectId; parentId: mongoose.Types.ObjectId | null }>();
      if (!target) {
        return NextResponse.json(
          { success: false, code: "COMMENT_GONE", message: "That comment was deleted, so you can't reply to it." },
          { status: 404 }
        );
      }
      const rootId = target.parentId ?? target._id;
      if (target.parentId && !(await PostComment.exists({ _id: rootId, post: postId }))) {
        return NextResponse.json(
          { success: false, code: "COMMENT_GONE", message: "This conversation was deleted." },
          { status: 404 }
        );
      }
      thread = { rootId, target };
    }

    // Create first, then bump counters — a failed create never inflates them.
    const created = await PostComment.create({
      post: post._id,
      author: req.user._id,
      content,
      parentId: thread?.rootId ?? null,
      replyTo: thread ? { comment: thread.target._id, user: thread.target.author } : null,
    });

    await Promise.all([
      Post.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } }, { timestamps: false }),
      thread ? PostComment.updateOne({ _id: thread.rootId }, { $inc: { replyCount: 1 } }) : null,
    ]);

    const comment = await loadComment(postId, String(created._id));

    // In-app notifications are saved before answering (so they're there the
    // moment the other person looks); push/email inside stay fire-and-forget.
    // They never fail the request — the comment is already saved.
    await notifyCommentActivity({
      postId,
      postAuthorId: String(post.author),
      commentId: String(created._id),
      replyTargetUserId: thread ? String(thread.target.author) : null,
      actor: { _id: userId, name: req.user.name, avatar: req.user.avatar ?? null },
      preview: content.slice(0, 100),
    }).catch((err) => console.error("[POST /posts/[id]/comments] notify failed:", err));

    return NextResponse.json({ success: true, message: "Comment added", comment }, { status: 201 });
  } catch (error) {
    console.error("[POST /posts/[id]/comments] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

async function notifyCommentActivity(input: {
  postId: string;
  postAuthorId: string;
  commentId: string;
  /** Author of the comment being replied to; null for a top-level comment. */
  replyTargetUserId: string | null;
  actor: { _id: string; name: string; avatar: string | null };
  preview: string;
}) {
  const { postId, postAuthorId, commentId, replyTargetUserId, actor, preview } = input;
  // Opens the post with this comment (and its thread) highlighted.
  const url = `/posts/${postId}?comment=${commentId}`;
  const base = {
    refModel: "PostComment" as const,
    refId: commentId,
    preview,
    url,
    actor: { userId: actor._id, name: actor.name, avatar: actor.avatar },
  };

  // 1) Someone replied to you (never notify yourself).
  const replyRecipient = replyTargetUserId && replyTargetUserId !== actor._id ? replyTargetUserId : null;
  if (replyRecipient) {
    await Notification.create({ ...base, recipient: replyRecipient, type: "comment_reply" });
    sendPushToUser(replyRecipient, {
      title: `${actor.name} replied to your comment`,
      body: preview,
      url,
      tag: `comment-reply-${commentId}`,
    }).catch(() => {});
  }

  // 2) The post's owner hears about activity on their post — unless they
  //    wrote it, or were already notified above as the person replied to.
  if (postAuthorId !== actor._id && postAuthorId !== replyRecipient) {
    await Notification.create({ ...base, recipient: postAuthorId, type: "post_comment" });
    // Push + email only for new top-level comments; replies stay in-app so a
    // busy thread doesn't buzz the owner's phone for every message.
    if (!replyTargetUserId) {
      sendPushToUser(postAuthorId, {
        title: `${actor.name} commented on your post`,
        body: preview,
        url,
        tag: `post-comment-${postId}`,
      }).catch(() => {});
      maybeSendPostCommentEmail(postAuthorId, actor.name, preview, postId).catch(() => {});
    }
  }
}
