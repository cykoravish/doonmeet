import mongoose, { Document, Schema } from "mongoose";

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
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

// Unique pair — prevents duplicate conversations between same two users
ConversationSchema.index({ participants: 1 }, { unique: true });
ConversationSchema.index({ updatedAt: -1 });

export const Conversation =
  mongoose.models.Conversation ?? mongoose.model<IConversation>("Conversation", ConversationSchema);
