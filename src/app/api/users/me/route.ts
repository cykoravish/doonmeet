// GET  — get own full profile
// PATCH — update own profile
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { generalLimiter } from "@/middleware/rateLimit";
import { updateProfileSchema } from "@/validations/user";

// GET /api/users/me
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  try {
    await connectDB();

    // Fetch fresh from DB — lean() for speed
    const user = await User.findById(req.user._id)
      .select(
        "-passwordHash -googleId -verificationToken -verificationExpires -resetPasswordToken -resetPasswordExpires -__v"
      )
      .lean();

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error("[GET /users/me] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

// PATCH /api/users/me
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  // Guests cannot update profile
  if (req.user.isGuest) {
    return NextResponse.json(
      { success: false, message: "Guests cannot update profile. Please sign up." },
      { status: 403 }
    );
  }

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
