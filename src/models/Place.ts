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
  /** Credit for a photo we didn't take (e.g. Wikimedia Commons) — shown under the image. */
  imageCredit: { author: string; license: string; licenseUrl: string | null; sourceUrl: string } | null;
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
    imageCredit: {
      type: new Schema(
        {
          author: { type: String, required: true },
          license: { type: String, required: true },
          licenseUrl: { type: String, default: null },
          sourceUrl: { type: String, required: true },
        },
        { _id: false }
      ),
      default: null,
    },
  },
  { timestamps: true }
);

export const Place = mongoose.models.Place ?? mongoose.model<IPlace>("Place", PlaceSchema);