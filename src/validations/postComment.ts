import { z } from "zod";
import { objectId, paginationSchema } from "./shared";

export const createPostCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment cannot exceed 500 characters"),
  parentId: objectId.optional().nullable(), // for future threading
});

export const getPostCommentsSchema = paginationSchema;

export type CreatePostCommentInput = z.infer<typeof createPostCommentSchema>;
