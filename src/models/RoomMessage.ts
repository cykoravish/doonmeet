import mongoose, { Document, Schema } from "mongoose";

export interface IRoomMessage extends Document {
  sender: mongoose.Types.ObjectId;
  content: string;
  type: "text";
  isGuest: boolean;
}

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
    isGuest: { type: Boolean, default: false },
  },
  { timestamps: true }
);

RoomMessageSchema.index({ createdAt: -1 });
RoomMessageSchema.index({ sender: 1 });

export const RoomMessage =
  mongoose.models.RoomMessage ?? mongoose.model<IRoomMessage>("RoomMessage", RoomMessageSchema);
