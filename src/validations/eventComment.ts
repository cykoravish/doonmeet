import { z } from "zod";
import { objectId, paginationSchema } from "./shared";
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment cannot exceed 500 characters"),
  parentId: objectId.optional().nullable(), // for future threading
});

export const getCommentsSchema = paginationSchema;

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
