// JWT access + refresh token helpers
// ============================================================
import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

const ACCESS_COOKIE_MAX_AGE = 15 * 60; // matches the access token's 15m expiry
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export function generateAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(userId: string): string {
  // jwtid makes every refresh token unique — two issued for the same user in
  // the same second would otherwise be identical strings (Session.token is unique).
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: "30d", jwtid: crypto.randomUUID() });
}

// For email verification and password reset — cryptographically secure
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// 4-digit numeric OTP for email verification (e.g. "0482"). Uses
// crypto.randomInt (rejection-sampled, unbiased) rather than Math.random.
export function generateOtp(): string {
  return crypto.randomInt(0, 10000).toString().padStart(4, "0");
}

// SameSite=Lax, not Strict: with Strict the browser leaves these cookies off
// when someone opens DoonMeet from another site — a Google result, a WhatsApp
// or Instagram link — so the first page showed them logged out until they
// refreshed. Lax still keeps the cookies off cross-site POSTs and background
// requests, which is what protects against CSRF.
function authCookie(name: string, value: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${value}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function setAuthCookies(
  response: Response,
  accessToken: string,
  refreshToken: string
): void {
  response.headers.append("Set-Cookie", authCookie("access_token", accessToken, ACCESS_COOKIE_MAX_AGE));
  response.headers.append("Set-Cookie", authCookie("refresh_token", refreshToken, REFRESH_COOKIE_MAX_AGE));
}

export function clearAuthCookies(response: Response): void {
  response.headers.append("Set-Cookie", authCookie("access_token", "", 0));
  response.headers.append("Set-Cookie", authCookie("refresh_token", "", 0));
}
