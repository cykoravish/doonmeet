import mongoose, { Document, Schema } from "mongoose";

export interface ICommunityPostComment extends Document {
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  parentId: mongoose.Types.ObjectId | null;
}

const CommunityPostCommentSchema = new Schema<ICommunityPostComment>(
  {
    post: { type: Schema.Types.ObjectId, ref: "CommunityPost", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
    parentId: { type: Schema.Types.ObjectId, ref: "CommunityPostComment", default: null }, // null for MVP, ready for threading later
  },
  { timestamps: true }
);

CommunityPostCommentSchema.index({ post: 1, createdAt: -1 });
CommunityPostCommentSchema.index({ author: 1 });

export const CommunityPostComment =
  mongoose.models.CommunityPostComment ??
  mongoose.model<ICommunityPostComment>("CommunityPostComment", CommunityPostCommentSchema);