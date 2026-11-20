import { z } from "zod";
import { paginationSchema } from "./shared";
import { POST_CATEGORY_VALUES } from "@/lib/postCategories";

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty")
    .max(3000, "Post cannot exceed 3000 characters"),
  category: z.enum(POST_CATEGORY_VALUES).optional().default("other"),
});

export const updatePostSchema = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty")
    .max(3000, "Post cannot exceed 3000 characters"),
  removeImage: z
    .union([z.boolean(), z.string()])
    .nullish()
    .transform((v) => v === true || v === "true"),
  // Optional — omitted means "keep the current category".
  category: z.enum(POST_CATEGORY_VALUES).nullish(),
});

export const getPostsSchema = paginationSchema.extend({
  author: z.string().regex(/^[a-f\d]{24}$/i, "Invalid author ID").optional(),
  category: z.enum(POST_CATEGORY_VALUES).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
