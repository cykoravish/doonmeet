// POST /api/auth/google
// app/api/auth/google/route.ts
//
// Flow:
// 1. Frontend signs in with Google → gets an ID token
// 2. Sends ID token to this endpoint
// 3. We verify it with Google's servers
// 4. Create or update user in DB
// 5. Issue our own JWT cookies — same as email login
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { authLimiter } from "@/middleware/rateLimit";
import { generateAccessToken, generateRefreshToken, setAuthCookies } from "@/lib/tokens";


export async function POST(req: NextRequest) {
  // Rate limit by IP
  const limited = authLimiter(req);
  if (limited) return limited;

  let idToken: string;

  try {
    const body = await req.json();
    idToken = body?.idToken;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
  }

  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json(
      { success: false, message: "Google ID token is required" },
      { status: 400 }
    );
  }

  try {
    // -------------------------------------------------------
    // 1. Verify the ID token with Google
    // This confirms the token is genuine and not tampered with
    // -------------------------------------------------------
    let googlePayload: {
      sub: string; // Google user ID
      email: string;
      email_verified: boolean;
      name: string;
      picture?: string;
    };

  try {
    const googleRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${idToken}` } }
    );

    if (!googleRes.ok) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired Google token. Please try again." },
        { status: 401 }
      );
    }

    const info = await googleRes.json();

    if (!info.email || !info.sub) {
      return NextResponse.json(
        { success: false, message: "Invalid Google token payload" },
        { status: 400 }
      );
    }

    if (!info.email_verified) {
      return NextResponse.json(
        { success: false, message: "Your Google email is not verified." },
        { status: 400 }
      );
    }

    googlePayload = {
      sub: info.sub,
      email: info.email.toLowerCase(),
      email_verified: info.email_verified,
      name: info.name ?? "DoonMeet User",
      picture: info.picture ?? undefined,
    };
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid or expired Google token. Please try again." },
      { status: 401 }
    );
  }

    // -------------------------------------------------------
    // 2. Find or create user in DB
    // -------------------------------------------------------
    await connectDB();

    let user = await User.findOne({ email: googlePayload.email }).select(
      "_id name email avatar role isActive googleId isVerified"
    );

    if (user) {
      // Block suspended users
      if (!user.isActive) {
        return NextResponse.json(
          {
            success: false,
            message: "Your account has been suspended. Please contact support.",
          },
          { status: 403 }
        );
      }

      // Existing email/password user — link Google to their account
      if (!user.googleId) {
        await User.updateOne(
          { _id: user._id },
          {
            googleId: googlePayload.sub,
            isVerified: true, // auto-verify since Google confirmed the email
            // Update avatar only if they haven't set a custom one
            ...(user.avatar === null && { avatar: googlePayload.picture }),
          }
        );
      }

      // Update last seen
      await User.updateOne({ _id: user._id }, { lastSeenAt: new Date() });
    } else {
      // Brand new user — create account
      user = await User.create({
        name: googlePayload.name,
        email: googlePayload.email,
        googleId: googlePayload.sub,
        avatar: googlePayload.picture ?? null,
        isVerified: true,
        role: "user",
      });
    }

    // -------------------------------------------------------
    // 3. Clean up expired sessions for this user
    // -------------------------------------------------------
    await Session.deleteMany({
      userId: user._id,
      expiresAt: { $lt: new Date() },
    });

    // -------------------------------------------------------
    // 4. Issue our JWT tokens — same flow as email login
    // -------------------------------------------------------
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
        message: "Logged in with Google successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
      },
      { status: 200 }
    );

    setAuthCookies(response as unknown as Response, accessToken, refreshToken);
    return response;
  } catch (error) {
    console.error("[google-auth] Error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
