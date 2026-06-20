import mongoose, { Document, Schema } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  userAgent: string | null;
  ip: string | null;
  expiresAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true },
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-delete expired sessions — MongoDB handles cleanup
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1 });
SessionSchema.index({ token: 1 });

export const Session =
  mongoose.models.Session ?? mongoose.model<ISession>("Session", SessionSchema);
