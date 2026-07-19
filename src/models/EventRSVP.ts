import mongoose, { Document, Schema } from "mongoose";

export interface IEventRSVP extends Document {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
}

const EventRSVPSchema = new Schema<IEventRSVP>({
  event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

// One RSVP per user per event
EventRSVPSchema.index({ event: 1, user: 1 }, { unique: true });
EventRSVPSchema.index({ event: 1, createdAt: -1 });
EventRSVPSchema.index({ user: 1 });

export const EventRSVP =
  mongoose.models.EventRSVP ?? mongoose.model<IEventRSVP>("EventRSVP", EventRSVPSchema);