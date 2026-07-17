// POST /api/auth/reset-password
// app/api/auth/reset-password/route.ts
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { validateBody } from "@/middleware/validate";
import { authLimiter } from "@/middleware/rateLimit";
import { resetPasswordSchema } from "@/validations/auth";

export async function POST(req: NextRequest) {
  const limited = authLimiter(req);
  if (limited) return limited;

  const result = await validateBody(req, resetPasswordSchema);
  if (result instanceof NextResponse) return result;
  const { token, password } = result.data as { token: string; password: string };

  try {
    await connectDB();

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Reset link is invalid or has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // Hash and save new password
    user.passwordHash = password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Invalidate all existing sessions — force re-login on all devices
    await Session.deleteMany({ userId: user._id });

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successful. Please log in with your new password.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[reset-password] Error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
