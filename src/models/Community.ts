import mongoose, { Document, Schema } from "mongoose";

export interface ICommunity extends Document {
  name: string;
  slug: string;
  description: string;
  banner: string | null;
  bannerPublicId: string | null;
  icon: string | null;
  category: "tech" | "nature" | "food" | "photography" | "sports" | "arts" | "general";
  createdBy: mongoose.Types.ObjectId;
  memberCount: number;
  isActive: boolean;
}

const CommunitySchema = new Schema<ICommunity>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
    banner: { type: String, default: null },
    bannerPublicId: { type: String, default: null },
    icon: { type: String, default: null },
    category: {
      type: String,
      enum: ["tech", "nature", "food", "photography", "sports", "arts", "general"],
      default: "general",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    memberCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CommunitySchema.index({ slug: 1 });
CommunitySchema.index({ category: 1 });

export const Community =
  mongoose.models.Community ?? mongoose.model<ICommunity>("Community", CommunitySchema);
