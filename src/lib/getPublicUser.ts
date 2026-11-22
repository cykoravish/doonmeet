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
        "name avatar bannerImage bio gender address interests occupation website dob lookingFor privacy role isActive isDeleted email phone passwordHash googleId createdAt lastSeenAt isOnline supporterSince"
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
      isOnline: !!user.isOnline,
      isSupporter: !!user.supporterSince,
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
    // Off by default — only when the person turned "Phone number" on in Privacy.
    if (user.privacy?.showPhone && user.phone) publicProfile.phone = user.phone;
    // Day + month only ("12 March") — the year would give away their age.
    // The full date never leaves the server.
    if (user.privacy?.showDOB && user.dob) {
      publicProfile.birthday = new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        timeZone: "Asia/Kolkata",
      }).format(new Date(user.dob));
    }

    return JSON.parse(JSON.stringify(publicProfile));
  } catch (error) {
    console.error("[getPublicUser] Error:", error);
    return null;
  }
}