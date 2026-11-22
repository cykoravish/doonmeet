import mongoose, { Document, Schema } from "mongoose";
import { POST_CATEGORY_VALUES, DEFAULT_POST_CATEGORY, type PostCategory } from "@/lib/postCategories";

export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  /** Missing on posts created before categories existed — treat as "other". */
  category: PostCategory;
  image: string | null;
  imagePublicId: string | null;
  /** Pixel size of the uploaded photo — lets the feed show it uncropped. Null on old posts until backfilled. */
  imageWidth: number | null;
  imageHeight: number | null;
  /** Every comment on the post, replies included. */
  commentCount: number;
  /** ❤️ count — kept in step with the PostLike collection. */
  likeCount: number;
  /** Set only when the author edits the post ("· edited" label). updatedAt
   *  also moves on likes/comments, so it can't tell an edit apart. */
  editedAt: Date | null;
  /** Paid sponsorship end time — pinned as "Sponsored" in the feed while in the future. */
  sponsoredUntil: Date | null;
  /** Promotions already applied to sponsoredUntil (makes applying idempotent). */
  sponsorPromotionIds: mongoose.Types.ObjectId[];
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
    category: { type: String, enum: POST_CATEGORY_VALUES, default: DEFAULT_POST_CATEGORY },
    image: { type: String, default: null },
    imagePublicId: { type: String, default: null },
    imageWidth: { type: Number, default: null },
    imageHeight: { type: Number, default: null },
    commentCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    editedAt: { type: Date, default: null },
    sponsoredUntil: { type: Date, default: null },
    // Internal bookkeeping — never sent to clients by default.
    sponsorPromotionIds: { type: [Schema.Types.ObjectId], default: [], select: false },
  },
  { timestamps: true }
);

// Global feed — newest first
PostSchema.index({ createdAt: -1 });
// A user's own posts (profile page)
PostSchema.index({ author: 1, createdAt: -1 });
// Category feed (/posts?category=jobs) — newest first by _id, like the main feed
PostSchema.index({ category: 1, _id: -1 });
// Weekly free business-post limit check
PostSchema.index({ author: 1, category: 1, createdAt: -1 });
// Active sponsored posts for the top of the feed
PostSchema.index({ sponsoredUntil: -1 });
// Full-text search for future search support
PostSchema.index({ content: "text" });

export const Post = mongoose.models.Post ?? mongoose.model<IPost>("Post", PostSchema);
