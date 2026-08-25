import mongoose, { Document, Schema } from "mongoose";

export type EmailType =
  | "verification"
  | "password_reset"
  | "new_dm"
  | "inactivity_reminder"
  | "admin_manual"
  | "post_comment";

export interface IEmailLog extends Document {
  recipient: mongoose.Types.ObjectId | null;
  recipientEmail: string;
  type: EmailType;
  subject: string;
  status: "sent" | "failed";
  errorMessage: string | null;
  createdAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", default: null },
    recipientEmail: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "verification",
        "password_reset",
        "new_dm",
        "inactivity_reminder",
        "admin_manual",
        "post_comment",
      ],
      required: true,
    },
    subject: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed"], required: true },
    errorMessage: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Admin dashboard queries — filter by recipient / type, newest first
EmailLogSchema.index({ recipient: 1, createdAt: -1 });
EmailLogSchema.index({ type: 1, createdAt: -1 });
EmailLogSchema.index({ status: 1, createdAt: -1 });
// Auto-delete logs older than 90 days — keeps the collection bounded
EmailLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const EmailLog =
  mongoose.models.EmailLog ?? mongoose.model<IEmailLog>("EmailLog", EmailLogSchema);
