// Shared shape + loaders for post comments and replies (see models/PostComment).
import mongoose from "mongoose";
import { PostComment } from "@/models/PostComment";

export interface CommentAuthor {
  _id: string;
  name: string;
  avatar: string | null;
}

/** What the API sends to the browser for one comment or reply. */
export interface CommentDTO {
  _id: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  /** null when the author's account no longer exists. */
  author: CommentAuthor | null;
  /** Thread's top-level comment id; null for a top-level comment. */
  parentId: string | null;
  /** Replies only — who this answers ("@Name"). user is null if that account is gone. */
  replyTo: { commentId: string; user: { _id: string; name: string } | null } | null;
  replyCount: number;
}

type Populated = {
  _id: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  editedAt?: Date | null;
  author: { _id: mongoose.Types.ObjectId; name: string; avatar?: string | null } | null;
  parentId?: mongoose.Types.ObjectId | null;
  replyTo?: { comment: mongoose.Types.ObjectId; user: { _id: mongoose.Types.ObjectId; name: string } | null } | null;
  replyCount?: number;
};

export const COMMENT_FIELDS = "post author content parentId replyTo replyCount editedAt createdAt";

export function toCommentDTO(c: Populated): CommentDTO {
  return {
    _id: String(c._id),
    content: c.content,
    createdAt: new Date(c.createdAt).toISOString(),
    editedAt: c.editedAt ? new Date(c.editedAt).toISOString() : null,
    author: c.author
      ? { _id: String(c.author._id), name: c.author.name, avatar: c.author.avatar ?? null }
      : null,
    parentId: c.parentId ? String(c.parentId) : null,
    replyTo: c.replyTo
      ? {
          commentId: String(c.replyTo.comment),
          user: c.replyTo.user ? { _id: String(c.replyTo.user._id), name: c.replyTo.user.name } : null,
        }
      : null,
    replyCount: c.replyCount ?? 0,
  };
}

/** Adds the author + "@Name" populate every comment query needs. */
export function populateComment<T extends mongoose.Query<unknown, unknown>>(query: T): T {
  return query
    .populate("author", "name avatar")
    .populate("replyTo.user", "name") as T;
}

/**
 * Newest `limit` top-level comments older than `cursor`, in reading order
 * (oldest → newest). nextCursor pages further back. Used by the API and to
 * server-render the first page on the post page.
 */
export async function getTopLevelComments(
  postId: string,
  { cursor, limit = 20 }: { cursor?: string; limit?: number } = {}
): Promise<{ comments: CommentDTO[]; nextCursor: string | null }> {
  const query: Record<string, unknown> = { post: postId, parentId: null };
  if (cursor) query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  const docs = await populateComment(
    PostComment.find(query).sort({ _id: -1 }).limit(limit).select(COMMENT_FIELDS)
  ).lean<Populated[]>();
  const nextCursor = docs.length === limit ? String(docs[docs.length - 1]._id) : null;
  return { comments: docs.reverse().map(toCommentDTO), nextCursor };
}

/** One comment (top-level or reply) of this post, ready to send — or null. */
export async function loadComment(postId: string, commentId: string): Promise<CommentDTO | null> {
  const doc = await populateComment(
    PostComment.findOne({ _id: commentId, post: postId }).select(COMMENT_FIELDS)
  ).lean<Populated>();
  return doc ? toCommentDTO(doc) : null;
}
