// app/api/auth/resend-verification/route.ts
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { validateBody } from "@/middleware/validate";
import { resendVerificationLimiter } from "@/middleware/rateLimit";
import { forgotPasswordSchema } from "@/validations/auth"; // reuses { email } shape
import { generateSecureToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const limited = resendVerificationLimiter(req);
  if (limited) return limited;

  const result = await validateBody(req, forgotPasswordSchema);
  if (result instanceof NextResponse) return result;
  const { email } = result.data as { email: string };

  try {
    await connectDB();

    const user = await User.findOne({ email }).select("isVerified googleId");

    // Always return same message to prevent email enumeration
    const genericResponse = NextResponse.json(
      { success: true, message: "If that email exists and is unverified, we've sent a new link." },
      { status: 200 }
    );

    if (!user || user.isVerified || user.googleId) return genericResponse;

    const verificationToken = generateSecureToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationExpires = verificationExpires;
    await user.save();

    sendVerificationEmail(email, verificationToken).catch((err) =>
      console.error("[resend-verification] Failed to send email:", err)
    );

    return genericResponse;
  } catch (error) {
    console.error("[resend-verification] Error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
