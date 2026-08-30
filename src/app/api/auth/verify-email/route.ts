// app/api/auth/verify-email/route.ts
// POST — verify the 4-digit OTP sent at signup, then auto-login the user
// (same cookie/session flow as /api/auth/login).
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { validateBody } from "@/middleware/validate";
import { otpVerifyLimiter } from "@/middleware/rateLimit";
import { verifyOtpSchema } from "@/validations/auth";
import { generateAccessToken, generateRefreshToken, setAuthCookies } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const result = await validateBody(req, verifyOtpSchema);
  if (result instanceof NextResponse) return result;
  const { email, otp } = result.data as { email: string; otp: string };

  // Key the limiter by email, not IP — throttles guesses against one
  // account without penalizing everyone else on the same network.
  const limited = otpVerifyLimiter(req, email);
  if (limited) return limited;

  try {
    await connectDB();

    const user = await User.findOne({ email }).select(
      "+verificationOtp +verificationOtpExpires +verificationOtpAttempts isVerified role"
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "No account found for this email." },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: false, message: "This account is already verified. Please log in." },
        { status: 400 }
      );
    }

    if (
      !user.verificationOtp ||
      !user.verificationOtpExpires ||
      user.verificationOtpExpires < new Date()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This code has expired. Please request a new one.",
          code: "OTP_EXPIRED",
        },
        { status: 400 }
      );
    }

    if (user.verificationOtp !== otp) {
      user.verificationOtpAttempts = (user.verificationOtpAttempts ?? 0) + 1;
      await user.save();
      return NextResponse.json(
        { success: false, message: "Incorrect code. Please try again." },
        { status: 400 }
      );
    }

    // Mark verified and clear OTP fields
    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    user.verificationOtpAttempts = 0;
    user.lastSeenAt = new Date();
    await user.save();

    // Auto-login — same flow as /api/auth/login
    const accessToken = generateAccessToken(String(user._id), user.role);
    const refreshToken = generateRefreshToken(String(user._id));

    await Session.create({
      userId: user._id,
      token: refreshToken,
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Email verified! You're now logged in.",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
      { status: 200 }
    );

    setAuthCookies(response as unknown as Response, accessToken, refreshToken);
    return response;
  } catch (error) {
    console.error("[verify-email] Error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
