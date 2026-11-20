import mongoose, { Document, Schema } from "mongoose";

// `blocker` has blocked `blocked`. Effect (by product decision): neither can
// start or send direct messages to the other. Public chat is unaffected.
export interface IBlock extends Document {
  blocker: mongoose.Types.ObjectId;
  blocked: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BlockSchema = new Schema<IBlock>(
  {
    blocker: { type: Schema.Types.ObjectId, ref: "User", required: true },
    blocked: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// One block per pair+direction; also serves "who have I blocked" (newest first).
BlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });
// "Has anyone blocked me" lookups in the DM checks.
BlockSchema.index({ blocked: 1, blocker: 1 });

export const Block = mongoose.models.Block ?? mongoose.model<IBlock>("Block", BlockSchema);
