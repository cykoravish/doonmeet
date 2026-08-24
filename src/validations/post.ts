import { z } from "zod";
import { paginationSchema } from "./shared";

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty")
    .max(3000, "Post cannot exceed 3000 characters"),
});

export const updatePostSchema = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty")
    .max(3000, "Post cannot exceed 3000 characters"),
  removeImage: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === "true"),
});

export const getPostsSchema = paginationSchema.extend({
  author: z.string().regex(/^[a-f\d]{24}$/i, "Invalid author ID").optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
