import { z } from "zod";
import { objectId, paginationSchema } from "./shared";
// A text message (content), or a shared profile card (sharedProfileUserId).
// Either can reply to an earlier message in the same conversation.
export const sendDirectMessageSchema = z
  .object({
    content: z.string().max(1000, "Message cannot exceed 1000 characters").optional(),
    replyToId: objectId.optional().nullable(),
    sharedProfileUserId: objectId.optional().nullable(),
  })
  .refine((d) => !!d.sharedProfileUserId || !!d.content?.trim(), {
    message: "Message cannot be empty",
    path: ["content"],
  });

export const createConversationSchema = z.object({
  recipientId: objectId,
});

export const getMessagesSchema = paginationSchema;

export type SendDirectMessageInput = z.infer<typeof sendDirectMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
