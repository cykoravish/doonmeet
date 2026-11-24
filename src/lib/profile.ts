// Extra data for the public profile page (/users/[userId]): the communities
// a member has joined, what they have in common with the viewer, and a
// simple "Online now / Active today" label.
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { CommunityMember } from "@/models/CommunityMember";
import { Community } from "@/models/Community";

export interface ProfileCommunity {
  _id: string;
  name: string;
  slug: string;
  category: string;
}

/** Active communities the member has joined, most recent first. */
export async function getUserCommunities(userId: string, limit = 12): Promise<ProfileCommunity[]> {
  if (!mongoose.isValidObjectId(userId)) return [];
  await connectDB();

  const memberships = await CommunityMember.find({ user: userId })
    .sort({ joinedAt: -1 })
    .limit(50)
    .select("community")
    .lean<{ community: mongoose.Types.ObjectId }[]>();
  if (memberships.length === 0) return [];

  const ids = memberships.map((m) => m.community);
  const communities = await Community.find({ _id: { $in: ids }, isActive: true })
    .select("name slug category")
    .lean<{ _id: mongoose.Types.ObjectId; name: string; slug: string; category: string }[]>();

  // Keep the "joined most recently" order from the membership query.
  const byId = new Map(communities.map((c) => [String(c._id), c]));
  return ids
    .map((id) => byId.get(String(id)))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .slice(0, limit)
    .map((c) => ({ _id: String(c._id), name: c.name, slug: c.slug, category: c.category }));
}

/** Which of these communities the viewer has also joined. */
export async function getSharedCommunityIds(viewerId: string, communityIds: string[]): Promise<Set<string>> {
  if (!mongoose.isValidObjectId(viewerId) || communityIds.length === 0) return new Set();
  await connectDB();
  const rows = await CommunityMember.find({ user: viewerId, community: { $in: communityIds } })
    .select("community")
    .lean<{ community: mongoose.Types.ObjectId }[]>();
  return new Set(rows.map((r) => String(r.community)));
}

/** Interests both people listed (interests are stored lowercase). */
export function sharedInterests(theirs: string[] | undefined, mine: string[] | undefined): string[] {
  if (!theirs?.length || !mine?.length) return [];
  const mineSet = new Set(mine.map((i) => i.toLowerCase()));
  return theirs.filter((i) => mineSet.has(i.toLowerCase()));
}

// Lives in a client-safe module now (the chat header uses it too).
export { activityLabel } from "@/lib/activity";
