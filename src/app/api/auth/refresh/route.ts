// app/api/auth/refresh/route.ts
// Rotates refresh token on every use (prevents token replay attacks)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { generateAccessToken, generateRefreshToken, setAuthCookies } from "@/lib/tokens";

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, message: "No refresh token provided" },
      { status: 401 }
    );
  }

  try {
    // Verify token signature
    let payload: { userId: string };
    try {
      payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: string };
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired session. Please log in again." },
        { status: 401 }
      );
    }

    await connectDB();

    // Check session exists in DB (prevents reuse of revoked tokens)
    const session = await Session.findOne({ token: refreshToken });
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found. Please log in again." },
        { status: 401 }
      );
    }

    const user = await User.findById(payload.userId).select("-passwordHash -googleId");
    if (!user || !user.isActive) {
      await Session.deleteOne({ _id: session._id });
      return NextResponse.json(
        { success: false, message: "User not found or suspended." },
        { status: 401 }
      );
    }

    // Rotate — delete old, create new refresh token
    const newAccessToken = generateAccessToken(String(user._id), user.role);
    const newRefreshToken = generateRefreshToken(String(user._id));

    await Session.deleteOne({ _id: session._id });
    await Session.create({
      userId: user._id,
      token: newRefreshToken,
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const response = NextResponse.json({ success: true }, { status: 200 });
    setAuthCookies(response as unknown as Response, newAccessToken, newRefreshToken);
    return response;
  } catch (error) {
    console.error("[refresh] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
