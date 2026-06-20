import mongoose, { Document, Schema } from "mongoose";

export interface ILocation extends Document {
  user: mongoose.Types.ObjectId;
  coords: { lat: number; lng: number };
  label: string | null;
  isVisible: boolean;
  checkedInAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    coords: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    label: { type: String, maxlength: 100, default: null }, // e.g. "I'm at Clock Tower"
    isVisible: { type: Boolean, default: true }, // false = hidden from map
    checkedInAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Geospatial index — enables $near queries for "find people near me" (future feature)
LocationSchema.index({ coords: "2dsphere" });
LocationSchema.index({ user: 1 }, { unique: true });
LocationSchema.index({ isVisible: 1 });

export const Location =
  mongoose.models.Location ?? mongoose.model<ILocation>("Location", LocationSchema);
