// GET  — get comments for a post (guests + users)
// POST — add a comment (logged in users only, not guests)
// ============================================================
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { PostComment } from "@/models/PostComment";
import { Notification } from "@/models/Notification";
import { withGuestAllowed, requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody, validateQuery } from "@/middleware/validate";
import { generalLimiter } from "@/middleware/rateLimit";
import { createPostCommentSchema, getPostCommentsSchema } from "@/validations/postComment";
import { sendPushToUser } from "@/lib/push";
import { maybeSendPostCommentEmail } from "@/lib/email";

// GET /api/posts/[postId]/comments
export const GET = withGuestAllowed(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
    if (limited) return limited;

    const { postId } = await params;

    if (!/^[a-f\d]{24}$/i.test(postId)) {
      return NextResponse.json({ success: false, message: "Invalid post ID" }, { status: 400 });
    }

    const queryResult = validateQuery(req, getPostCommentsSchema);
    if (queryResult instanceof NextResponse) return queryResult;
    const { cursor, limit } = queryResult.data;

    try {
      await connectDB();

      const postExists = await Post.exists({ _id: postId });
      if (!postExists) {
        return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });
      }

      const query: Record<string, unknown> = { post: postId, parentId: null };

      if (cursor) {
        if (!/^[a-f\d]{24}$/i.test(cursor)) {
          return NextResponse.json({ success: false, message: "Invalid cursor" }, { status: 400 });
        }
        query._id = { $lt: cursor };
      }

      const comments = await PostComment.find(query)
        .sort({ _id: -1 })
        .limit(limit)
        .populate("author", "name avatar")
        .select("-__v")
        .lean();

      const ordered = comments.reverse();
      const nextCursor =
        comments.length === limit ? String(comments[comments.length - 1]._id) : null;

      return NextResponse.json(
        {
          success: true,
          comments: ordered,
          nextCursor,
          hasMore: !!nextCursor,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("[GET /posts/[id]/comments] Error:", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      );
    }
  }
);

// POST /api/posts/[postId]/comments
export const POST = requireVerified(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user._id));
    if (limited) return limited;

    const { postId } = await params;

    if (!/^[a-f\d]{24}$/i.test(postId)) {
      return NextResponse.json({ success: false, message: "Invalid post ID" }, { status: 400 });
    }

    const result = await validateBody(req, createPostCommentSchema);
    if (result instanceof NextResponse) return result;
    const data = result.data as { content: string; parentId?: string | null };

    try {
      await connectDB();

      const post = await Post.findById(postId).select("author commentCount");
      if (!post) {
        return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });
      }

      const [comment] = await Promise.all([
        PostComment.create({
          post: post._id,
          author: req.user._id,
          content: data.content,
          parentId: data.parentId ?? null,
        }),
        Post.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } }),
      ]);

      await comment.populate("author", "name avatar");

      // Notify post owner if commenter is not the owner themselves
      const isOwnPost = String(post.author) === String(req.user._id);
      if (!isOwnPost) {
        const postUrl = `/posts/${post._id}`;
        const preview = data.content.slice(0, 100);

        await Notification.create({
          recipient: post.author,
          type: "post_comment",
          refModel: "PostComment",
          refId: comment._id,
          preview,
          url: postUrl,
          actor: {
            userId: req.user._id,
            name: req.user.name,
            avatar: req.user.avatar,
          },
        });

        sendPushToUser(String(post.author), {
          title: `${req.user.name} commented on your post`,
          body: preview,
          url: postUrl,
          tag: `post-comment-${post._id}`,
        }).catch(() => {
          // Errors are already logged inside the helper.
        });

        // Only reaches the recipient's inbox if they're currently offline —
        // avoids emailing someone about something they'll see instantly in-app.
        maybeSendPostCommentEmail(
          String(post.author),
          req.user.name,
          preview,
          String(post._id)
        ).catch(() => {
          // Errors are already logged inside the helper.
        });
      }

      return NextResponse.json(
        { success: true, message: "Comment added", comment },
        { status: 201 }
      );
    } catch (error) {
      console.error("[POST /posts/[id]/comments] Error:", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      );
    }
  }
);
