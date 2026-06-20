import mongoose, { Document, Schema } from "mongoose";

export interface IEvent extends Document {
  creator: mongoose.Types.ObjectId;
  title: string;
  description: string;
  banner: string | null;
  bannerPublicId: string | null;
  location: {
    name: string;
    address: string;
    coords: { lat: number | null; lng: number | null };
  };
  date: Date;
  endsAt: Date | null;
  tags: string[];
  capacity: number | null;
  status: "draft" | "published" | "cancelled";
  commentCount: number;
}

const EventSchema = new Schema<IEvent>(
  {
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    banner: { type: String, default: null },
    bannerPublicId: { type: String, default: null },
    location: {
      name: { type: String, maxlength: 100, default: "" },
      address: { type: String, maxlength: 200, default: "" },
      coords: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
    date: { type: Date, required: true },
    endsAt: { type: Date, default: null },
    tags: {
      type: [String],
      validate: {
        validator: (arr: string[]) => arr.length <= 5,
        message: "Cannot add more than 5 tags",
      },
      default: [],
    },
    capacity: { type: Number, default: null }, // null = unlimited
    status: { type: String, enum: ["draft", "published", "cancelled"], default: "published" },
    commentCount: { type: Number, default: 0 }, // incremented via $inc — no extra query needed
  },
  { timestamps: true }
);

EventSchema.index({ date: 1 });
EventSchema.index({ creator: 1 });
EventSchema.index({ status: 1, date: 1 }); // listing upcoming published events
EventSchema.index({ tags: 1 });
EventSchema.index({ title: "text", description: "text" }); // full-text search

export const Event = mongoose.models.Event ?? mongoose.model<IEvent>("Event", EventSchema);
