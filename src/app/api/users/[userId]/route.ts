// GET — get public profile of any user
// Respects privacy settings — only returns fields user has made public
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { withGuestAllowed, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

export const GET = withGuestAllowed(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(
      req,
      String(req.user?._id ?? req.headers.get("x-forwarded-for") ?? "guest")
    );
    if (limited) return limited;

    const { userId } = await params;

    // Validate ObjectId format
    if (!/^[a-f\d]{24}$/i.test(userId)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 });
    }

    try {
      await connectDB();

      const user = await User.findById(userId)
        .select(
          "name avatar bio gender address interests privacy role isGuest createdAt lastSeenAt"
        )
        .lean();

      if (!user || !user.isActive || user.isGuest) {
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
      }

      // Build public profile — respect privacy settings
      const publicProfile: Record<string, unknown> = {
        _id: user._id,
        name: user.name, // name always public
        avatar: user.avatar, // avatar always public
        bio: user.bio, // bio always public
        role: user.role,
        createdAt: user.createdAt,
        lastSeenAt: user.lastSeenAt,
      };

      // Conditionally include fields based on privacy settings
      if (user.privacy?.showGender) publicProfile.gender = user.gender;
      if (user.privacy?.showAddress) publicProfile.address = user.address;
      if (user.privacy?.showInterests) publicProfile.interests = user.interests;

      // Email only shown if user explicitly enabled it
      if (user.privacy?.showEmail) publicProfile.email = user.email;

      return NextResponse.json({ success: true, user: publicProfile }, { status: 200 });
    } catch (error) {
      console.error("[GET /users/[userId]] Error:", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      );
    }
  }
);
