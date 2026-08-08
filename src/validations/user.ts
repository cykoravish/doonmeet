import { z } from "zod";
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

// "All members" list — page-based (not cursor) because results are sorted
// online-first then alphabetically; a compound sort like that doesn't map
// cleanly onto a single opaque cursor, and at this app's scale (a single
// city's user base) skip/limit is simple, correct, and fast enough.
export const listUsersSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => Math.max(parseInt(val ?? "1", 10) || 1, 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => Math.min(Math.max(parseInt(val ?? "20", 10) || 20, 1), 50)),
  search: z
    .string()
    .max(50)
    .optional()
    .transform((val) => val?.trim() || undefined),
});

export type ListUsersInput = z.infer<typeof listUsersSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePrivacyInput = z.infer<typeof updatePrivacySchema>;
