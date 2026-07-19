import mongoose, { Document, Schema } from "mongoose";

export interface ICommunityPost extends Document {
  community: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    community: { type: Schema.Types.ObjectId, ref: "Community", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, "Post cannot exceed 1000 characters"],
    },
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CommunityPostSchema.index({ community: 1, createdAt: -1 });

export const CommunityPost =
  mongoose.models.CommunityPost ?? mongoose.model<ICommunityPost>("CommunityPost", CommunityPostSchema);