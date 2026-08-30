import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { CommunityMember } from "@/models/CommunityMember";
import { EventRSVP } from "@/models/EventRSVP";
import { PlaceReview } from "@/models/PlaceReview";

// Shared by the /users/[userId] page (direct DB call, no self-fetch) and the
// /api/users/[userId] route (HTTP, used by client components).
export async function getPublicUser(userId: string) {
  if (!/^[a-f\d]{24}$/i.test(userId)) return null;

  try {
    await connectDB();

    const user = await User.findById(userId)
      .select(
        "name avatar bannerImage bio gender address interests occupation website dob lookingFor privacy role isActive isDeleted email passwordHash googleId createdAt lastSeenAt"
      )
      .lean();

    // Two-layer deleted-account check — see GET /api/users for full
    // reasoning on why both the isDeleted flag AND the anonymized
    // fingerprint (email+passwordHash+googleId all null) are checked.
    const isAnonymized = !user?.email && !user?.passwordHash && !user?.googleId;
    if (!user || !user.isActive || user.isDeleted || isAnonymized) return null;

    const [communitiesCount, eventsCount, reviewsCount] = await Promise.all([
      CommunityMember.countDocuments({ user: userId }),
      EventRSVP.countDocuments({ user: userId }),
      PlaceReview.countDocuments({ user: userId }),
    ]);

    const publicProfile: Record<string, unknown> = {
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      bannerImage: user.bannerImage,
      bio: user.bio,
      role: user.role,
      occupation: user.occupation,
      website: user.website,
      lookingFor: user.lookingFor,
      createdAt: user.createdAt,
      lastSeenAt: user.lastSeenAt,
      stats: {
        communities: communitiesCount,
        events: eventsCount,
        reviews: reviewsCount,
      },
    };

    if (user.privacy?.showGender) publicProfile.gender = user.gender;
    if (user.privacy?.showAddress) publicProfile.address = user.address;
    if (user.privacy?.showInterests) publicProfile.interests = user.interests;
    if (user.privacy?.showEmail) publicProfile.email = user.email;
    if (user.privacy?.showDOB) publicProfile.dob = user.dob;

    return JSON.parse(JSON.stringify(publicProfile));
  } catch (error) {
    console.error("[getPublicUser] Error:", error);
    return null;
  }
}