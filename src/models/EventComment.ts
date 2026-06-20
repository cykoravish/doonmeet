import mongoose, { Document, Schema } from "mongoose";

export interface IEventComment extends Document {
  event: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  parentId: mongoose.Types.ObjectId | null;
}

const EventCommentSchema = new Schema<IEventComment>(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
    parentId: { type: Schema.Types.ObjectId, ref: "EventComment", default: null }, // null for MVP, ready for threading later
  },
  { timestamps: true }
);

EventCommentSchema.index({ event: 1, createdAt: -1 });
EventCommentSchema.index({ author: 1 });

export const EventComment =
  mongoose.models.EventComment ?? mongoose.model<IEventComment>("EventComment", EventCommentSchema);
