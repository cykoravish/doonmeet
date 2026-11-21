import mongoose, { Document, Schema } from "mongoose";

// One "Support DoonMeet" (buy-me-a-coffee) payment attempt via Cashfree.
export interface ISupport extends Document {
  user: mongoose.Types.ObjectId;
  /** Rupees (whole number). */
  amount: number;
  currency: "INR";
  message: string | null;
  status: "created" | "paid" | "failed";
  /** Our order id sent to Cashfree (unique, e.g. dms_<supportId>). */
  orderId: string;
  cfOrderId: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SupportSchema = new Schema<ISupport>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, enum: ["INR"], default: "INR" },
    message: { type: String, maxlength: 140, default: null },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    orderId: { type: String, required: true, unique: true },
    cfOrderId: { type: String, default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

SupportSchema.index({ user: 1, createdAt: -1 });
SupportSchema.index({ status: 1, paidAt: -1 });

export const Support = mongoose.models.Support ?? mongoose.model<ISupport>("Support", SupportSchema);
