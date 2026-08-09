import { z } from "zod";
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
    .optional(),
  bio: z.string().max(300, "Bio cannot exceed 300 characters").optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional().nullable(),
  address: z.string().max(100, "Address cannot exceed 100 characters").optional(),
  interests: z
    .array(z.string().max(30, "Each interest cannot exceed 30 characters"))
    .max(10, "Cannot have more than 10 interests")
    .optional(),
  phone: z
    .union([z.string(), z.null()])
    .optional()
    .transform((val) => (val ? val.replace(/[\s-]/g, "") : null))
    .refine((val) => val === null || /^\+?[0-9]{10,15}$/.test(val), "Invalid phone number"),
  occupation: z.string().max(60, "Occupation cannot exceed 60 characters").optional(),
  website: z
    .string()
    .max(150, "Website cannot exceed 150 characters")
    .refine(
      (val) => val === "" || /^https?:\/\/.+\..+/.test(val),
      "Enter a valid URL (starting with http:// or https://)"
    )
    .optional(),
  dob: z
    .union([z.string(), z.null()])
    .optional()
    .transform((val) => (val ? new Date(val) : null))
    .refine((val) => val === null || !isNaN(val.getTime()), "Invalid date")
    .refine((val) => val === null || val <= new Date(), "Date of birth cannot be in the future"),
  lookingFor: z
    .enum(["student", "working_professional", "entrepreneur", "new_to_dehradun", "just_exploring"])
    .optional()
    .nullable(),
});

export const updatePrivacySchema = z.object({
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showGender: z.boolean().optional(),
  showAddress: z.boolean().optional(),
  showInterests: z.boolean().optional(),
  showDOB: z.boolean().optional(),
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
