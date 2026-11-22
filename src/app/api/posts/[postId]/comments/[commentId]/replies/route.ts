// GET /api/posts/[postId]/comments/[commentId]/replies?cursor=<last _id shown>
// Replies of one thread, oldest → newest (conversation order).
// [commentId] must be the thread's top-level comment.
// ============================================================
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { PostComment } from "@/models/PostComment";
import { withGuestAllowed, AuthenticatedRequest } from "@/middleware/auth";
import { validateQuery } from "@/middleware/validate";
import { generalLimiter } from "@/middleware/rateLimit";
import { commentPageSchema } from "@/validations/postComment";
import { COMMENT_FIELDS, populateComment, toCommentDTO } from "@/lib/postComments";

const isObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

export const GET = withGuestAllowed(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
    if (limited) return limited;

    const { postId, commentId } = await params;
    if (!isObjectId(postId) || !isObjectId(commentId)) {
      return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
    }

    const queryResult = validateQuery(req, commentPageSchema);
    if (queryResult instanceof NextResponse) return queryResult;
    const { cursor, limit } = queryResult.data;

    try {
      await connectDB();

      if (!(await PostComment.exists({ _id: commentId, post: postId, parentId: null }))) {
        return NextResponse.json(
          { success: false, code: "COMMENT_GONE", message: "This comment was deleted." },
          { status: 404 }
        );
      }

      const query: Record<string, unknown> = { post: postId, parentId: commentId };
      if (cursor) query._id = { $gt: new mongoose.Types.ObjectId(cursor) };

      const docs = await populateComment(
        PostComment.find(query).sort({ _id: 1 }).limit(limit).select(COMMENT_FIELDS)
      ).lean();

      const nextCursor = docs.length === limit ? String(docs[docs.length - 1]._id) : null;
      const replies = docs.map((d) => toCommentDTO(d as Parameters<typeof toCommentDTO>[0]));

      return NextResponse.json({ success: true, replies, nextCursor, hasMore: !!nextCursor });
    } catch (error) {
      console.error("[GET /posts/[id]/comments/[cid]/replies] Error:", error);
      return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
    }
  }
);
