import { z } from "zod";
import { objectId, paginationSchema } from "./shared";
export const sendRoomMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(500, "Message cannot exceed 500 characters"),
  /** Quote another public-chat message. */
  replyToId: objectId.optional(),
});

export const getRoomMessagesSchema = paginationSchema;

export type SendRoomMessageInput = z.infer<typeof sendRoomMessageSchema>;
