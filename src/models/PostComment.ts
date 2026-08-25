import mongoose, { Document, Schema } from "mongoose";

export interface IPostComment extends Document {
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  parentId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const PostCommentSchema = new Schema<IPostComment>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
    parentId: { type: Schema.Types.ObjectId, ref: "PostComment", default: null }, // null for MVP, ready for threading later
  },
  { timestamps: true }
);

PostCommentSchema.index({ post: 1, createdAt: -1 });
PostCommentSchema.index({ author: 1 });

export const PostComment =
  mongoose.models.PostComment ?? mongoose.model<IPostComment>("PostComment", PostCommentSchema);
