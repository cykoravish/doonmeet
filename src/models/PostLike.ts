import mongoose, { Document, Schema } from "mongoose";

// One ❤️ per person per post. Post.likeCount is the denormalised total.
export interface IPostLike extends Document {
  post: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
}

const PostLikeSchema = new Schema<IPostLike>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Unique: a person can like a post once. Also serves "did I like these posts?"
// lookups (post $in [...] + user).
PostLikeSchema.index({ post: 1, user: 1 }, { unique: true });

export const PostLike = mongoose.models.PostLike ?? mongoose.model<IPostLike>("PostLike", PostLikeSchema);
