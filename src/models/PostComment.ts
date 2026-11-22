import mongoose, { Document, Schema } from "mongoose";

// Comments + Instagram-style replies.
//
// A thread is one top-level comment (parentId: null) plus every reply under
// it. People can reply to the top-level comment OR to any reply, as deep as
// they like — every reply is stored with parentId = the thread's top-level
// comment (so the thread stays one flat, readable list on a 360px phone) and
// replyTo = the exact comment/person it answers (shown as "@Name").
export interface IPostComment extends Document {
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  /** Top-level comment of the thread; null for a top-level comment itself. */
  parentId: mongoose.Types.ObjectId | null;
  /** The comment this reply answers (any depth) and its author — null for top-level comments. */
  replyTo: { comment: mongoose.Types.ObjectId; user: mongoose.Types.ObjectId } | null;
  /** Top-level comments only: how many replies the thread has. */
  replyCount: number;
  /** Set when the author edits the text. */
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ReplyToSchema = new Schema(
  {
    comment: { type: Schema.Types.ObjectId, ref: "PostComment", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: false }
);

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
    parentId: { type: Schema.Types.ObjectId, ref: "PostComment", default: null },
    replyTo: { type: ReplyToSchema, default: null },
    replyCount: { type: Number, default: 0 },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PostCommentSchema.index({ post: 1, createdAt: -1 });
PostCommentSchema.index({ author: 1 });
// Top-level comments of a post, paged by _id.
PostCommentSchema.index({ post: 1, parentId: 1, _id: -1 });
// Replies of a thread, oldest first.
PostCommentSchema.index({ parentId: 1, _id: 1 });

export const PostComment =
  mongoose.models.PostComment ?? mongoose.model<IPostComment>("PostComment", PostCommentSchema);
