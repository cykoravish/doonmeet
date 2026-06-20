import mongoose, { Document, Schema } from "mongoose";

export interface IDirectMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  type: "text";
  readBy: { userId: mongoose.Types.ObjectId; readAt: Date }[];
}

const DirectMessageSchema = new Schema<IDirectMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    type: { type: String, enum: ["text"], default: "text" },
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

// Primary query pattern: fetch messages by conversation, latest first
DirectMessageSchema.index({ conversationId: 1, createdAt: -1 });
DirectMessageSchema.index({ sender: 1 });

export const DirectMessage =
  mongoose.models.DirectMessage ??
  mongoose.model<IDirectMessage>("DirectMessage", DirectMessageSchema);
