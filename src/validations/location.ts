import { z } from "zod";
import { objectId, paginationSchema } from "./shared";

export const checkInSchema = z.object({
  coords: z.object({
    lat: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude"),
    lng: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude"),
  }),
  label: z.string().max(100, "Label cannot exceed 100 characters").optional().nullable(),
  isVisible: z.boolean().optional().default(true),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
