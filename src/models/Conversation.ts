import mongoose, { Document, Schema } from "mongoose";

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  participantsKey: string;
  lastMessage: {
    content: string | null;
    sentAt: Date | null;
    senderId: mongoose.Types.ObjectId | null;
  };
  unreadCount: Map<string, number>;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    // Deterministic "sortedId1_sortedId2" string — this is what enforces
    // "one conversation per pair of users". A unique index directly on
    // `participants` would be a *multikey* index, which enforces
    // uniqueness per array ELEMENT across every document, not per pair —
    // that would let each user appear in at most one conversation, ever.
    participantsKey: { type: String, required: true, unique: true },
    lastMessage: {
      content: { type: String, default: null },
      sentAt: { type: Date, default: null },
      senderId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    },
    // Keyed by userId string — e.g. { "abc123": 3, "def456": 0 }
    unreadCount: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

ConversationSchema.index({ updatedAt: -1 });

export const Conversation =
  mongoose.models.Conversation ?? mongoose.model<IConversation>("Conversation", ConversationSchema);
