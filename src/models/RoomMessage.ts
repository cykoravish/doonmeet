import mongoose, { Document, Schema } from "mongoose";

/**
 * Snapshot of the message being replied to. The sender's NAME is not stored
 * — it's looked up when the message is read, so a deleted account's real
 * name never lingers in quotes.
 */
export interface IRoomReply {
  messageId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  preview: string;
}

export interface IRoomMessage extends Document {
  sender: mongoose.Types.ObjectId;
  content: string;
  type: "text";
  replyTo: IRoomReply | null;
}

const RoomReplySchema = new Schema<IRoomReply>(
  {
    messageId: { type: Schema.Types.ObjectId, ref: "RoomMessage", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    preview: { type: String, required: true, maxlength: 200 },
  },
  { _id: false }
);

const RoomMessageSchema = new Schema<IRoomMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    type: { type: String, enum: ["text"], default: "text" },
    replyTo: { type: RoomReplySchema, default: null },
  },
  { timestamps: true }
);

RoomMessageSchema.index({ createdAt: -1 });
RoomMessageSchema.index({ sender: 1 });

export const RoomMessage =
  mongoose.models.RoomMessage ?? mongoose.model<IRoomMessage>("RoomMessage", RoomMessageSchema);
