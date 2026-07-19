import { z } from "zod";

export const createPlaceReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  text: z
    .string()
    .trim()
    .min(10, "Review must be at least 10 characters")
    .max(1000, "Review cannot exceed 1000 characters"),
});

export type CreatePlaceReviewInput = z.infer<typeof createPlaceReviewSchema>;