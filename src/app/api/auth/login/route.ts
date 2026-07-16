// app/api/auth/login/route.ts
//a simple change in comment
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { validateBody } from "@/middleware/validate";
import { authLimiter } from "@/middleware/rateLimit";
import { loginSchema } from "@/validations/auth";
import { generateAccessToken, generateRefreshToken, setAuthCookies } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const limited = authLimiter(req);
  if (limited) return limited;

  const result = await validateBody(req, loginSchema);
  if (result instanceof NextResponse) return result;
  const { email, password } = result.data as { email: string; password: string };

  try {
    await connectDB();

    // Include passwordHash for comparison (normally excluded by toJSON)
    const user = await User.findOne({ email }).select("+passwordHash");

    // Generic message prevents email enumeration
    const invalidMsg = "Invalid email or password";

    if (!user) {
      return NextResponse.json({ success: false, message: invalidMsg }, { status: 401 });
    }

    // User signed up with Google and hasn't set a password yet
    if (!user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This account uses Google login. Please sign in with Google, or set a password from your account settings.",
          code: "USE_GOOGLE_LOGIN",
        },
        { status: 401 }
      );
    }

    const passwordMatch = await user.comparePassword(password);

    if (!passwordMatch) {
      return NextResponse.json({ success: false, message: invalidMsg }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "Your account has been suspended. Contact support." },
        { status: 403 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please verify your email before logging in. Check your inbox or request a new link.",
          code: "EMAIL_UNVERIFIED",
        },
        { status: 403 }
      );
    }

    // Update last seen
    user.lastSeenAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(String(user._id), user.role);
    const refreshToken = generateRefreshToken(String(user._id));

    // Store refresh token
    await Session.create({
      userId: user._id,
      token: refreshToken,
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Logged in successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          isGuest: user.isGuest,
          isVerified: user.isVerified,
        },
      },
      { status: 200 }
    );

    setAuthCookies(response as unknown as Response, accessToken, refreshToken);
    return response;
  } catch (error) {
    console.error("[login] Error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
