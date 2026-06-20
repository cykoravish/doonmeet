import { z } from "zod";
import { objectId, paginationSchema } from "./shared";
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
    .optional(),
  bio: z.string().max(300, "Bio cannot exceed 300 characters").optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  address: z.string().max(100, "Address cannot exceed 100 characters").optional(),
  interests: z
    .array(z.string().max(30, "Each interest cannot exceed 30 characters"))
    .max(10, "Cannot have more than 10 interests")
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, "Invalid phone number")
    .optional()
    .nullable(),
});

export const updatePrivacySchema = z.object({
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showGender: z.boolean().optional(),
  showAddress: z.boolean().optional(),
  showInterests: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePrivacyInput = z.infer<typeof updatePrivacySchema>;
