// POST /api/auth/signup
// app/api/auth/signup/route.ts
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { validateBody } from "@/middleware/validate";
import { authLimiter } from "@/middleware/rateLimit";
import { signupSchema } from "@/validations/auth";
import {
  generateSecureToken,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
} from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const limited = authLimiter(req);
  if (limited) return limited;

  const result = await validateBody(req, signupSchema);
  if (result instanceof NextResponse) return result;
  const { name, email, password } = result.data as {
    name: string;
    email: string;
    password: string;
  };

  try {
    await connectDB();

    const existing = await User.findOne({ email }).select("_id isVerified googleId");

    if (existing) {
      // Allow re-signup only if previous account was never verified
      if (existing.isVerified) {
        // Check if they used Google
        if (existing.googleId) {
          return NextResponse.json(
            {
              success: false,
              message: "This email is linked to a Google account. Please log in with Google.",
              code: "USE_GOOGLE_LOGIN",
            },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { success: false, message: "An account with this email already exists." },
          { status: 409 }
        );
      }

      // Unverified account — overwrite it (user may not have received verification email)
      await User.deleteOne({ _id: existing._id });
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate email verification token (expires 24h)
    const verificationToken = generateSecureToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      name,
      email,
      passwordHash,
      isVerified: false,
      // Store token temporarily on user doc — cleared after verification
      verificationToken,
      verificationExpires,
    });

    // Send verification email — don't block response on failure
    sendVerificationEmail(email, verificationToken).catch((err) =>
      console.error("[signup] Failed to send verification email:", err)
    );

    return NextResponse.json(
      {
        success: true,
        message: "Account created! Please check your email to verify your account.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[signup] Error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
