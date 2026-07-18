import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { rotateSession } from "@/lib/rotateSession";
import { setAuthCookies } from "@/lib/tokens";

// Next.js 16 — proxy.ts replaces middleware.ts
// Same Edge Runtime rules apply — use jose not jsonwebtoken

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET);

// Routes that require a logged in verified user (not guest)
const PROTECTED_ROUTES = ["/profile", "/settings", "/events/create"];

// Routes only for unauthenticated users
const AUTH_ROUTES = ["/login", "/signup", "/verify-email", "/reset-password", "/forgot-password"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  console.log("[PROXY]", pathname);

  let accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;
  console.log("[PROXY] accessToken:", !!accessToken, "refreshToken:", !!refreshToken);

  let isAuthenticated = false;
  let isGuest = false;
  let refreshedTokens: { accessToken: string; refreshToken: string } | null = null;

  // Access token missing/expired but a refresh token exists — silently rotate
  if (!accessToken && refreshToken) {
    try {
      const result = await rotateSession(refreshToken, {
        userAgent: req.headers.get("user-agent"),
        ip: req.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
      });
        console.log("[PROXY] rotateSession result:", result ? "SUCCESS" : "NULL");
      if (result) {
        accessToken = result.accessToken;
        refreshedTokens = result;
      }
    } catch {
      // refresh token invalid/expired — proceed as unauthenticated
    }
  }

  if (accessToken) {
    try {
      const { payload } = await jwtVerify(accessToken, ACCESS_TOKEN_SECRET);
      isAuthenticated = true;
      isGuest = payload.role === "guest";
    } catch {
      isAuthenticated = false;
    }
  }

  // Redirect logged in users away from auth pages
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated && !isGuest) {
    const response = NextResponse.redirect(new URL("/", req.url));
    if (refreshedTokens) {
      setAuthCookies(
        response as unknown as Response,
        refreshedTokens.accessToken,
        refreshedTokens.refreshToken
      );
    }
    return response;
  }

  // Protect routes that require a verified logged in user
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && (!isAuthenticated || isGuest)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (refreshedTokens) {
      setAuthCookies(
        response as unknown as Response,
        refreshedTokens.accessToken,
        refreshedTokens.refreshToken
      );
    }
    return response;
  }

  if (refreshedTokens) {
    req.cookies.set("access_token", refreshedTokens.accessToken);
  }

  const response = NextResponse.next({ request: req });

  if (refreshedTokens) {
    setAuthCookies(
      response as unknown as Response,
      refreshedTokens.accessToken,
      refreshedTokens.refreshToken
    );
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
