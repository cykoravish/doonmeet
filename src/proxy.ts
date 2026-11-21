import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { rotateSession } from "@/lib/rotateSession";
import { clearAuthCookies, setAuthCookies } from "@/lib/tokens";
import { getClientIp } from "@/lib/clientIp";

// Next.js 16 — proxy.ts replaces middleware.ts (runs on the Node.js runtime).

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET);

// Routes that require a logged in verified user
const PROTECTED_ROUTES = ["/profile", "/settings", "/events/create"];

// Routes only for unauthenticated users
const AUTH_ROUTES = ["/login", "/signup", "/verify-email", "/reset-password", "/forgot-password"];

// These read and replace the refresh token themselves. Rotating it here first
// would hand them an already-used token (refresh → 401, logout → still logged in).
const SESSION_ROUTES = ["/api/auth/refresh", "/api/auth/logout"];

async function isValidAccessToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, ACCESS_TOKEN_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (SESSION_ROUTES.includes(pathname)) return NextResponse.next();

  const refreshToken = req.cookies.get("refresh_token")?.value;
  let isAuthenticated = await isValidAccessToken(req.cookies.get("access_token")?.value);
  let refreshed: { accessToken: string; refreshToken: string } | null = null;
  let sessionDead = false;

  // Access token missing or expired but a refresh token exists — rotate it
  // silently, so this very page renders logged in (no manual refresh needed).
  if (!isAuthenticated && refreshToken) {
    try {
      refreshed = await rotateSession(refreshToken, {
        userAgent: req.headers.get("user-agent"),
        ip: getClientIp(req.headers),
      });
      isAuthenticated = !!refreshed;
      sessionDead = !refreshed;
    } catch (error) {
      // Database hiccup — treat this request as logged out but keep the cookies.
      console.error("[proxy] session refresh failed:", error);
    }
  }

  const finish = (response: NextResponse) => {
    if (refreshed) {
      setAuthCookies(response as unknown as Response, refreshed.accessToken, refreshed.refreshToken);
    } else if (sessionDead) {
      // Logged out elsewhere / expired / banned: drop the dead cookies so we
      // don't look the session up again on every request.
      clearAuthCookies(response as unknown as Response);
    }
    return response;
  };

  // Redirect logged in users away from auth pages
  if (isAuthenticated && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return finish(NextResponse.redirect(new URL("/", req.url)));
  }

  // Protect routes that require a verified logged in user
  if (!isAuthenticated && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return finish(NextResponse.redirect(loginUrl));
  }

  // Let this request's page / API handler see the new tokens straight away.
  if (refreshed) {
    req.cookies.set("access_token", refreshed.accessToken);
    req.cookies.set("refresh_token", refreshed.refreshToken);
  }
  return finish(NextResponse.next({ request: req }));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
