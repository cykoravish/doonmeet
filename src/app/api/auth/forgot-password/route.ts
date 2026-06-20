// app/api/auth/forgot-password/route.ts
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { validateBody } from "@/middleware/validate";
import { resendVerificationLimiter } from "@/middleware/rateLimit";
import { forgotPasswordSchema } from "@/validations/auth";
import { generateSecureToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const limited = resendVerificationLimiter(req);
  if (limited) return limited;

  const result = await validateBody(req, forgotPasswordSchema);
  if (result instanceof NextResponse) return result;
  const { email } = result.data as { email: string };

  // Always return same response — prevents email enumeration
  const genericResponse = NextResponse.json(
    { success: true, message: "If that email is registered, you'll receive a reset link shortly." },
    { status: 200 }
  );

  try {
    await connectDB();

    const user = await User.findOne({ email, isVerified: true }).select("_id googleId");
    if (!user || user.googleId) return genericResponse; // Google users reset via Google

    const resetToken = generateSecureToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;

    user.resetPasswordExpires = resetExpires;
    await user.save();

    sendPasswordResetEmail(email, resetToken).catch((err) =>
      console.error("[forgot-password] Failed to send email:", err)
    );

    return genericResponse;
  } catch (error) {
    console.error("[forgot-password] Error:", error);
    return genericResponse; // still return generic on error — don't leak info
  }
}
