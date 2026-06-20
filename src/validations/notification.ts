import { z } from "zod";
import { objectId, paginationSchema } from "./shared";
export const getNotificationsSchema = paginationSchema.extend({
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsSchema>;
