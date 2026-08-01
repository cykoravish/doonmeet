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
      .select("name avatar bio gender address interests privacy role isGuest isActive createdAt lastSeenAt")
      .lean();

    if (!user || !user.isActive || user.isGuest) return null;

    const [communitiesCount, eventsCount, reviewsCount] = await Promise.all([
      CommunityMember.countDocuments({ user: userId }),
      EventRSVP.countDocuments({ user: userId }),
      PlaceReview.countDocuments({ user: userId }),
    ]);

    const publicProfile: Record<string, unknown> = {
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
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

    return JSON.parse(JSON.stringify(publicProfile));
  } catch (error) {
    console.error("[getPublicUser] Error:", error);
    return null;
  }
}