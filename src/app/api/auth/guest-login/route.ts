// app/api/auth/guest-login/route.ts
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { validateBody } from "@/middleware/validate";
import { authLimiter } from "@/middleware/rateLimit";
import { guestLoginSchema } from "@/validations/auth";
import { generateAccessToken, generateRefreshToken, setAuthCookies } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const limited = authLimiter(req);
  if (limited) return limited;

  const result = await validateBody(req, guestLoginSchema);
  if (result instanceof NextResponse) return result;
  const { name } = result.data as { name: string };

  try {
    await connectDB();

    const guestName = `Guest_${name}`;
    const guestExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      name: guestName,
      role: "guest",
      isGuest: true,
      isVerified: true, // guests skip email verification
      guestExpiresAt: guestExpiry,
      guestMessageCount: 0,
    });

    const accessToken = generateAccessToken(String(user._id), user.role);
    const refreshToken = generateRefreshToken(String(user._id));

    await Session.create({
      userId: user._id,
      token: refreshToken,
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
      expiresAt: guestExpiry,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Joined as guest",
        user: {
          _id: user._id,
          name: user.name,
          role: user.role,
          isGuest: true,
          guestExpiresAt: guestExpiry,
          guestMessageCount: 0,
        },
      },
      { status: 201 }
    );

    setAuthCookies(response as unknown as Response, accessToken, refreshToken);
    return response;
  } catch (error) {
    console.error("[guest-login] Error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
