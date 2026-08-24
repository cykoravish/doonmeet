import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  image: string | null;
  imagePublicId: string | null;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [3000, "Post cannot exceed 3000 characters"],
    },
    image: { type: String, default: null },
    imagePublicId: { type: String, default: null },
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Global feed — newest first
PostSchema.index({ createdAt: -1 });
// A user's own posts (profile page)
PostSchema.index({ author: 1, createdAt: -1 });
// Full-text search for future search support
PostSchema.index({ content: "text" });

export const Post = mongoose.models.Post ?? mongoose.model<IPost>("Post", PostSchema);
