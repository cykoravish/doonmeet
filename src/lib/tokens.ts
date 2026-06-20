// JWT access + refresh token helpers
// ============================================================
import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

export function generateAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
}

// For email verification and password reset — cryptographically secure
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function setAuthCookies(
  response: Response,
  accessToken: string,
  refreshToken: string
): void {
  const isProd = process.env.NODE_ENV === "production";

  response.headers.append(
    "Set-Cookie",
    `access_token=${accessToken}; HttpOnly; Path=/; Max-Age=900; SameSite=Strict${isProd ? "; Secure" : ""}`
  );
  response.headers.append(
    "Set-Cookie",
    `refresh_token=${refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict${isProd ? "; Secure" : ""}`
  );
}

export function clearAuthCookies(response: Response): void {
  response.headers.append(
    "Set-Cookie",
    "access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict"
  );
  response.headers.append(
    "Set-Cookie",
    "refresh_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict"
  );
}
