// PATCH — change password (for users who have a password set)
// Also handles Google users setting a password for the first time
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { authLimiter } from "@/middleware/rateLimit";
import { changePasswordSchema, setPasswordSchema } from "@/validations/auth";
import bcrypt from "bcryptjs";

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  const limited = authLimiter(req, String(req.user._id));
  if (limited) return limited;

  if (req.user.isGuest) {
    return NextResponse.json(
      { success: false, message: "Guests cannot set a password. Please sign up." },
      { status: 403 }
    );
  }

  try {
    await connectDB();

    const user = await User.findById(req.user._id).select("+passwordHash googleId");
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const isGoogleOnlyUser = user.googleId && !user.passwordHash;

    if (isGoogleOnlyUser) {
      // Google user setting password for the first time — no current password needed
      const result = await validateBody(req, setPasswordSchema);
      if (result instanceof NextResponse) return result;
      const data = result.data as { password: string };

      const salt = await bcrypt.genSalt(12);
      user.passwordHash = await bcrypt.hash(data.password, salt);
      await user.save();

      return NextResponse.json(
        {
          success: true,
          message: "Password set successfully. You can now log in with email and password.",
        },
        { status: 200 }
      );
    }

    // Regular user changing existing password
    const result = await validateBody(req, changePasswordSchema);
    if (result instanceof NextResponse) return result;
    const data = result.data as { currentPassword: string; newPassword: string };
    const passwordMatch = await user.comparePassword(data.currentPassword);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 401 }
      );
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(data.newPassword, salt);
    await user.save();

    // Invalidate all other sessions — force re-login on other devices
    const currentRefreshToken = req.cookies.get("refresh_token")?.value;
    await Session.deleteMany({
      userId: user._id,
      token: { $ne: currentRefreshToken }, // keep current session alive
    });

    return NextResponse.json(
      { success: true, message: "Password changed successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PATCH /users/me/password] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
