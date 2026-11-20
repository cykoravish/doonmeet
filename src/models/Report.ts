import mongoose, { Document, Schema } from "mongoose";

export const REPORT_REASONS = ["harassment", "inappropriate", "spam", "fake_profile", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_CONTEXTS = ["room_message", "direct_message", "profile", "post"] as const;
export type ReportContext = (typeof REPORT_CONTEXTS)[number];

export interface IReport extends Document {
  reporter: mongoose.Types.ObjectId;
  reported: mongoose.Types.ObjectId;
  context: ReportContext;
  /** The reported message/post, when the report is about one. */
  refId: mongoose.Types.ObjectId | null;
  /** Copy of the reported content taken server-side at report time — survives edits/deletes. */
  snapshot: string | null;
  reason: ReportReason;
  details: string;
  status: "open" | "reviewed" | "dismissed";
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reported: { type: Schema.Types.ObjectId, ref: "User", required: true },
    context: { type: String, enum: REPORT_CONTEXTS, required: true },
    refId: { type: Schema.Types.ObjectId, default: null },
    snapshot: { type: String, maxlength: 1000, default: null },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, maxlength: 500, default: "" },
    status: { type: String, enum: ["open", "reviewed", "dismissed"], default: "open" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Auto-mute check: distinct reporters against one user in the last 24h.
ReportSchema.index({ reported: 1, createdAt: -1 });
// Admin review queue.
ReportSchema.index({ status: 1, createdAt: -1 });
// Duplicate-report guard (same reporter → same person).
ReportSchema.index({ reporter: 1, reported: 1, createdAt: -1 });

export const Report = mongoose.models.Report ?? mongoose.model<IReport>("Report", ReportSchema);
