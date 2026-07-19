import { connectDB } from "@/lib/db";
import { Community } from "@/models/Community";
import { CommunityMember } from "@/models/CommunityMember";
import { Event } from "@/models/Event";

export async function getAllCommunities(category?: string) {
  await connectDB();
  const query: Record<string, unknown> = { isActive: true };
  if (category) query.category = category;

  return Community.find(query)
    .sort({ memberCount: -1, _id: -1 })
    .populate("createdBy", "name avatar")
    .select("-bannerPublicId -__v")
    .lean();
}

export async function getCommunityBySlug(slug: string) {
  await connectDB();
  return Community.findOne({ slug, isActive: true })
    .populate("createdBy", "name avatar")
    .select("-bannerPublicId -__v")
    .lean();
}

export async function getCommunityMembers(communityId: string, limit = 24) {
  await connectDB();
  return CommunityMember.find({ community: communityId })
    .sort({ joinedAt: -1 })
    .limit(limit)
    .populate("user", "name avatar")
    .lean();
}

export async function isUserMember(communityId: string, userId?: string) {
  if (!userId) return false;
  await connectDB();
  return !!(await CommunityMember.exists({ community: communityId, user: userId }));
}

export async function getCommunityEvents(communityId: string, limit = 6) {
  await connectDB();
  return Event.find({
    community: communityId,
    status: "published",
    date: { $gte: new Date() },
  })
    .sort({ date: 1 })
    .limit(limit)
    .select("title slug banner date location")
    .lean();
}