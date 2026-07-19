import mongoose, { Document, Schema } from "mongoose";

export interface IPlace extends Document {
  title: string;
  slug: string;
  image: string;
  category: string;
  shortDescription: string;
  about: string;
  highlights: string[];
  bestTimeToVisit: string;
  howToReach: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlaceSchema = new Schema<IPlace>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    shortDescription: { type: String, required: true, trim: true, maxlength: 200 },
    about: { type: String, required: true },
    highlights: { type: [String], default: [] },
    bestTimeToVisit: { type: String, default: "" },
    howToReach: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Place = mongoose.models.Place ?? mongoose.model<IPlace>("Place", PlaceSchema);