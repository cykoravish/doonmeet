// GET  — get own full profile
// PATCH — update own profile
// DELETE — permanently delete own account (soft-delete + anonymize)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { PushSubscription } from "@/models/PushSubscription";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { generalLimiter, authLimiter } from "@/middleware/rateLimit";
import { updateProfileSchema } from "@/validations/user";
import { deleteAccountSchema } from "@/validations/auth";
import { clearAuthCookies } from "@/lib/tokens";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET /api/users/me
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  try {
    await connectDB();

    const user = await User.findById(req.user._id)
      .select(
        "-googleId -verificationToken -verificationExpires -resetPasswordToken -resetPasswordExpires -__v"
      )
      .lean();

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const { passwordHash, ...safeUser } = user;

    return NextResponse.json(
      { success: true, user: { ...safeUser, hasPassword: !!passwordHash } },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /users/me] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

// PATCH /api/users/me
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  const result = await validateBody(req, updateProfileSchema);
  if (result instanceof NextResponse) return result;

  try {
    await connectDB();

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: result.data as object },
      {
        new: true, // return updated doc
        runValidators: true, // run schema validators on update
        select:
          "-passwordHash -googleId -verificationToken -verificationExpires -resetPasswordToken -resetPasswordExpires -__v",
      }
    ).lean();

    if (!updated) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: "Profile updated successfully", user: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PATCH /users/me] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

// DELETE /api/users/me
// Permanently deletes the caller's account. We soft-delete + anonymize the
// User document in place rather than removing it: existing posts, comments,
// community memberships, event RSVPs and messages all reference this
// user's ObjectId, and wiping the doc entirely would either orphan those
// records or require touching every collection in the app. Anonymizing
// means all of that content simply renders as "Deleted User" going forward.
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  const limited = authLimiter(req, String(req.user._id));
  if (limited) return limited;

  const result = await validateBody(req, deleteAccountSchema);
  if (result instanceof NextResponse) return result;
  const { confirmation } = result.data as { confirmation: string };

  try {
    await connectDB();

    const user = await User.findById(req.user._id).select(
      "+passwordHash googleId avatarPublicId bannerPublicId isDeleted"
    );

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (user.isDeleted) {
      return NextResponse.json(
        { success: false, message: "This account is already deleted." },
        { status: 400 }
      );
    }

    const isGoogleOnlyUser = user.googleId && !user.passwordHash;

    if (isGoogleOnlyUser) {
      // No password on file — require the user to type DELETE to confirm.
      if (confirmation.trim().toUpperCase() !== "DELETE") {
        return NextResponse.json(
          { success: false, message: 'Please type "DELETE" to confirm.' },
          { status: 400 }
        );
      }
    } else {
      // Regular user — confirmation field is their account password.
      const passwordMatch = await user.comparePassword(confirmation);
      if (!passwordMatch) {
        return NextResponse.json(
          { success: false, message: "Incorrect password." },
          { status: 401 }
        );
      }
    }

    // Best-effort cleanup of Cloudinary assets — don't block deletion on this.
    const cloudinaryIds = [user.avatarPublicId, user.bannerPublicId].filter(Boolean) as string[];
    await Promise.all(
      cloudinaryIds.map((id) =>
        cloudinary.uploader
          .destroy(id)
          .catch((err) => console.error("[delete-account] Cloudinary cleanup failed:", err))
      )
    );

    // Anonymize the profile in place.
    user.name = "Deleted User";
    user.email = null;
    user.phone = null;
    user.passwordHash = null;
    user.googleId = null;
    user.avatar = null;
    user.avatarPublicId = null;
    user.bannerImage = null;
    user.bannerPublicId = null;
    user.bio = "";
    user.gender = null;
    user.address = "";
    user.interests = [];
    user.occupation = "";
    user.website = "";
    user.dob = null;
    user.lookingFor = null;
    user.privacy = {
      showEmail: false,
      showPhone: false,
      showGender: false,
      showAddress: false,
      showInterests: false,
      showDOB: false,
    };
    user.isVerified = false;
    user.isOnline = false;
    user.isDeleted = true;
    user.deletedAt = new Date();

    await user.save();

    // Force logout everywhere and stop any push notifications.
    await Session.deleteMany({ userId: user._id });
    await PushSubscription.deleteMany({ user: user._id });

    const response = NextResponse.json(
      { success: true, message: "Your account has been permanently deleted." },
      { status: 200 }
    );
    clearAuthCookies(response as unknown as Response);
    return response;
  } catch (error) {
    console.error("[DELETE /users/me] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
