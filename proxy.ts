import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Next.js 16 — proxy.ts replaces middleware.ts
// Same Edge Runtime rules apply — use jose not jsonwebtoken

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET);

// Routes that require a logged in verified user (not guest)
const PROTECTED_ROUTES = ["/profile", "/settings"];

// Routes only for unauthenticated users
const AUTH_ROUTES = ["/login", "/signup", "/verify-email", "/reset-password", "/forgot-password"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const accessToken = req.cookies.get("access_token")?.value;

  let isAuthenticated = false;
  let isGuest = false;

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
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Protect routes that require a verified logged in user
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && (!isAuthenticated || isGuest)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
