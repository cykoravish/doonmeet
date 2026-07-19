import { z } from "zod";
import { paginationSchema } from "./shared";

// With — create a base schema without refine, then apply partial
const eventBaseSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  location: z.object({
    name: z.string().max(100).optional().default(""),
    address: z.string().max(200).optional().default(""),
    coords: z.object({
      lat: z.number().min(-90).max(90).optional().nullable(),
      lng: z.number().min(-180).max(180).optional().nullable(),
    }).optional(),
  }).optional(),
  date: z
    .string()
    .datetime("Invalid date format")
    .optional(),
  endsAt: z
    .string()
    .datetime("Invalid date format")
    .optional()
    .nullable(),
  tags: z
    .array(z.string().max(30))
    .max(5, "Cannot add more than 5 tags")
    .optional()
    .default([]),
  capacity: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  status: z.enum(["draft", "published", "cancelled"]).optional(),
  community: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid community id")
    .optional()
    .nullable(),
});

export const createEventSchema = eventBaseSchema.extend({
  date: z
    .string()
    .datetime("Invalid date format")
    .refine((d) => new Date(d) > new Date(), "Event date must be in the future"),
}).refine(
  (data) => {
    if (data.endsAt && data.date) {
      return new Date(data.endsAt) > new Date(data.date);
    }
    return true;
  },
  { message: "End time must be after start time", path: ["endsAt"] }
);

// updateEventSchema uses base directly — no refines, safe to use as-is
export const updateEventSchema = eventBaseSchema;

export const getEventsSchema = paginationSchema.extend({
  status: z.enum(["draft", "published", "cancelled"]).optional().default("published"),
  tag: z.string().optional(),
  search: z.string().max(100).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type GetEventsQuery = z.infer<typeof getEventsSchema>;
