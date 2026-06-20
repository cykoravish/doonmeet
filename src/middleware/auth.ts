// Verifies JWT access token and attaches user to request.
// Usage: wrap any API handler with withAuth()
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { User, IUser } from "@/models/User";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error("ACCESS_TOKEN_SECRET is not defined in environment variables");
}

export interface AuthenticatedRequest extends NextRequest {
  user: IUser;
}

type RouteHandler = (
  req: AuthenticatedRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

// -------------------------
// withAuth — protects any route handler
// -------------------------
export function withAuth(handler: RouteHandler) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      // 1. Extract token from Authorization header or httpOnly cookie
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : req.cookies.get("access_token")?.value;

      if (!token) {
        return NextResponse.json(
          { success: false, message: "Authentication required" },
          { status: 401 }
        );
      }

      // 2. Verify token
      let payload: { userId: string; role: string };
      try {
        payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as {
          userId: string;
          role: string;
        };
      } catch (err) {
        const isExpired = err instanceof jwt.TokenExpiredError;
        return NextResponse.json(
          {
            success: false,
            message: isExpired ? "Session expired. Please log in again." : "Invalid token",
          },
          { status: 401 }
        );
      }

      // 3. Fetch user — lean() for speed, select only what's needed
      await connectDB();
      const user = await User.findById(payload.userId)
        .select("-passwordHash -googleId -__v")
        .lean<IUser>();

      if (!user) {
        return NextResponse.json({ success: false, message: "User not found" }, { status: 401 });
      }

      // 4. Block banned or inactive users
      if (!user.isActive) {
        return NextResponse.json(
          { success: false, message: "Your account has been suspended" },
          { status: 403 }
        );
      }

      // 5. Block unverified users (except guests — they skip email verification)
      if (!user.isVerified && !user.isGuest) {
        return NextResponse.json(
          {
            success: false,
            message: "Please verify your email before continuing",
            code: "EMAIL_UNVERIFIED",
          },
          { status: 403 }
        );
      }

      // 6. Block expired guest sessions
      if (user.isGuest && user.guestExpiresAt && new Date() > user.guestExpiresAt) {
        return NextResponse.json(
          {
            success: false,
            message: "Your guest session has expired. Please sign up to continue.",
            code: "GUEST_EXPIRED",
          },
          { status: 403 }
        );
      }

      // 7. Attach user to request and proceed
      (req as AuthenticatedRequest).user = user;
      return handler(
        req as AuthenticatedRequest,
        context as { params: Promise<Record<string, string>> }
      );
    } catch (error) {
      console.error("[withAuth] Unexpected error:", error);
      return NextResponse.json(
        { success: false, message: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

// withGuestAllowed — routes accessible by both users and guests
// Still validates token if present, but doesn't block if missing
// -------------------------
export function withGuestAllowed(handler: RouteHandler) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : req.cookies.get("access_token")?.value;

      if (token) {
        try {
          const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as {
            userId: string;
          };
          await connectDB();
          const user = await User.findById(payload.userId)
            .select("-passwordHash -googleId -__v")
            .lean<IUser>();

          if (user && user.isActive) {
            (req as AuthenticatedRequest).user = user;
          }
        } catch {
          // Invalid token on a guest-allowed route — just continue without user
        }
      }

      return handler(
        req as AuthenticatedRequest,
        context as { params: Promise<Record<string, string>> }
      );
    } catch (error) {
      console.error("[withGuestAllowed] Unexpected error:", error);
      return NextResponse.json(
        { success: false, message: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

// -------------------------
// requireVerified — extra guard for sensitive actions
// Use on top of withAuth for things like event creation
// -------------------------
export function requireVerified(handler: RouteHandler) {
  return withAuth(async (req: AuthenticatedRequest, context) => {
    if (req.user.isGuest) {
      return NextResponse.json(
        { success: false, message: "Guests cannot perform this action. Please sign up." },
        { status: 403 }
      );
    }
    return handler(req, context);
  });
}
