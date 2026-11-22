import { z } from "zod";
import { objectId } from "./shared";

// trim() BEFORE min(1): "   " used to pass validation and then fail inside
// Mongoose (trim → empty → required), which surfaced as a 500.
const commentText = z
  .string()
  .trim()
  .min(1, "Comment cannot be empty")
  .max(500, "Comment cannot exceed 500 characters");

export const createPostCommentSchema = z.object({
  content: commentText,
  /** The comment (top-level or a reply, any depth) this one replies to. */
  parentId: objectId.optional().nullable(),
});

export const updatePostCommentSchema = z.object({
  content: commentText,
});

/** ?cursor=<_id>&limit=<n> — a bad limit falls back to the default instead of NaN. */
export const commentPageSchema = z.object({
  cursor: objectId.optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const n = val ? parseInt(val, 10) : NaN;
      return Number.isFinite(n) && n > 0 ? Math.min(n, 50) : 20;
    }),
});

export type CreatePostCommentInput = z.infer<typeof createPostCommentSchema>;
