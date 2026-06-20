import { z } from "zod";
import { objectId, paginationSchema } from "./shared";
export const sendDirectMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message cannot exceed 1000 characters"),
});

export const createConversationSchema = z.object({
  recipientId: objectId,
});

export const getMessagesSchema = paginationSchema;

export type SendDirectMessageInput = z.infer<typeof sendDirectMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
