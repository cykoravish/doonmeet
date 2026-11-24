import mongoose, { Document, Schema } from "mongoose";

export interface IDirectMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  /** Always set — for a profile card it's "Shared a profile: Name" (previews, notifications, admin). */
  content: string;
  /** "profile" = a shared profile card (see sharedProfile). */
  type: "text" | "profile";
  readBy: { userId: mongoose.Types.ObjectId; readAt: Date }[];
  /** Set when this message replies to another one in the same conversation. */
  replyTo: { messageId: mongoose.Types.ObjectId; senderId: mongoose.Types.ObjectId; preview: string } | null;
  /** One emoji per person (WhatsApp-style). */
  reactions: { userId: mongoose.Types.ObjectId; emoji: string }[];
  /** Snapshot of the shared profile when type is "profile". */
  sharedProfile: { userId: mongoose.Types.ObjectId; name: string; avatar: string | null } | null;
}

const ReplyToSchema = new Schema(
  {
    messageId: { type: Schema.Types.ObjectId, ref: "DirectMessage", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    preview: { type: String, maxlength: 200, default: "" },
  },
  { _id: false }
);

const ReactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true, maxlength: 16 },
  },
  { _id: false }
);

const SharedProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, maxlength: 80 },
    avatar: { type: String, default: null },
  },
  { _id: false }
);

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
    type: { type: String, enum: ["text", "profile"], default: "text" },
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date },
      },
    ],
    replyTo: { type: ReplyToSchema, default: null },
    reactions: { type: [ReactionSchema], default: [] },
    sharedProfile: { type: SharedProfileSchema, default: null },
  },
  { timestamps: true }
);

// Primary query pattern: fetch messages by conversation, latest first
DirectMessageSchema.index({ conversationId: 1, createdAt: -1 });
DirectMessageSchema.index({ sender: 1 });

export const DirectMessage =
  mongoose.models.DirectMessage ??
  mongoose.model<IDirectMessage>("DirectMessage", DirectMessageSchema);
