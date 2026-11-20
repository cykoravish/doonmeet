import mongoose, { Document, Schema } from "mongoose";

// One paid sponsorship purchase (a Razorpay order) for a post.
// created → paid (captured & applied to the post) | failed.
export interface IPromotion extends Document {
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  /** Paise. */
  amount: number;
  currency: string;
  days: number;
  status: "created" | "paid" | "failed";
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  paidAt: Date | null;
  /** Sponsorship window this purchase added to the post (set once applied). */
  startsAt: Date | null;
  endsAt: Date | null;
  /** Set when the payment succeeded but couldn't be applied (e.g. post deleted) — needs a manual refund. */
  issue: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    days: { type: Number, required: true },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, default: null },
    paidAt: { type: Date, default: null },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    issue: { type: String, default: null },
  },
  { timestamps: true }
);

PromotionSchema.index({ user: 1, createdAt: -1 });
PromotionSchema.index({ post: 1, createdAt: -1 });
// Admin: revenue / payments list
PromotionSchema.index({ status: 1, createdAt: -1 });

export const Promotion =
  mongoose.models.Promotion ?? mongoose.model<IPromotion>("Promotion", PromotionSchema);
