import mongoose, { Document, Schema } from "mongoose";

export interface ICommunityMember extends Document {
  community: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  joinedAt: Date;
}

const CommunityMemberSchema = new Schema<ICommunityMember>({
  community: { type: Schema.Types.ObjectId, ref: "Community", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  joinedAt: { type: Date, default: Date.now },
});

// One membership per user per community
CommunityMemberSchema.index({ community: 1, user: 1 }, { unique: true });
CommunityMemberSchema.index({ community: 1, joinedAt: -1 });
CommunityMemberSchema.index({ user: 1 });

export const CommunityMember =
  mongoose.models.CommunityMember ??
  mongoose.model<ICommunityMember>("CommunityMember", CommunityMemberSchema);