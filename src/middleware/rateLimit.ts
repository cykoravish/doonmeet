// Per-IP and per-user rate limiting using a sliding window.
// No Redis needed for MVP — uses in-memory Map (resets on server restart).
// NOTE: Swap to Redis (ioredis + sliding window) when scaling to multiple instances.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/clientIp";
// The counters live in a Next-free module so the Socket.IO server can use them too.
import { DM_LIMIT, ROOM_CHAT_LIMIT, hit, type RateLimitOptions } from "@/lib/rateLimitStore";

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix } = options;

  return function checkRateLimit(req: NextRequest, userId?: string): NextResponse | null {
    // Use userId if available (more accurate), fall back to IP
    const identifier = userId ?? getClientIp(req.headers) ?? "unknown";
    const now = Date.now();
    const { entry, limited } = hit(`${keyPrefix}:${identifier}`, windowMs, max);

    if (limited) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests. Please slow down.",
          retryAfter: retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
            "X-RateLimit-Limit": String(max),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
          },
        }
      );
    }

    return null; // allowed
  };
}

// -------------------------
// Pre-configured limiters — import and use directly in route handlers
// -------------------------

// Auth routes — strict (prevents brute force + account spam)
export const authLimiter = rateLimit({
  keyPrefix: "auth",
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
});

// Public room chat — prevents message flooding (same limit on the socket)
export const roomChatLimiter = rateLimit(ROOM_CHAT_LIMIT);

// Direct messages (same limit on the socket)
export const dmLimiter = rateLimit(DM_LIMIT);

// Event creation — prevents spam events
export const eventLimiter = rateLimit({
  keyPrefix: "event",
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
});

// Post creation — prevents spam posts
export const postLimiter = rateLimit({
  keyPrefix: "post",
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
});

// General API reads
export const generalLimiter = rateLimit({
  keyPrefix: "general",
  windowMs: 60 * 1000,
  max: 200,
});

// Verification email resend — prevent email bombing
export const resendVerificationLimiter = rateLimit({
  keyPrefix: "resend_verification",
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
});

// OTP verify attempts — a 4-digit OTP only has 10,000 combinations, so this
// is deliberately tighter than authLimiter. Callers key it by email (see
// verify-email route) so it throttles guesses against one account without
// affecting other signups from the same IP (e.g. shared/college wifi).
export const otpVerifyLimiter = rateLimit({
  keyPrefix: "otp_verify",
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8,
});

// User reports — generous for genuine use, stops report-spamming.
export const reportLimiter = rateLimit({
  keyPrefix: "report",
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
});

// Payments — creating orders / verifying payments.
export const paymentLimiter = rateLimit({
  keyPrefix: "payment",
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
});

// Support payment status checks — the page polls every few seconds while a
// payment is in progress (only reveals paid / pending / failed).
export const paymentStatusLimiter = rateLimit({
  keyPrefix: "payment-status",
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 300,
});

