import mongoose, { Document, Schema } from "mongoose";

export interface IPushSubscription extends Document {
  user: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent: string | null;
  createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Unique per browser/device — a user can have several (phone, laptop, etc.)
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PushSubscriptionSchema.index({ user: 1 });

export const PushSubscription =
  mongoose.models.PushSubscription ??
  mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);
