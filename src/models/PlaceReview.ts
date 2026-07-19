import mongoose, { Document, Schema } from "mongoose";

export interface IPlaceReview extends Document {
  place: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlaceReviewSchema = new Schema<IPlaceReview>(
  {
    place: { type: Schema.Types.ObjectId, ref: "Place", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// One review per user per place — re-submitting updates the existing one
PlaceReviewSchema.index({ place: 1, user: 1 }, { unique: true });
PlaceReviewSchema.index({ place: 1, createdAt: -1 });

export const PlaceReview =
  mongoose.models.PlaceReview ?? mongoose.model<IPlaceReview>("PlaceReview", PlaceReviewSchema);