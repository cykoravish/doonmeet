// Per-IP and per-user rate limiting using a sliding window.
// No Redis needed for MVP — uses in-memory Map (resets on server restart).
// NOTE: Swap to Redis (ioredis + sliding window) when scaling to multiple instances.
// ============================================================
import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix ms timestamp
}

// In-memory store — key: "ip:route" or "userId:route"
const store = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs: number; // time window in milliseconds
  max: number; // max requests in window
  keyPrefix: string; // identifies the route/action
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix } = options;

  return function checkRateLimit(req: NextRequest, userId?: string): NextResponse | null {
    // Use userId if available (more accurate), fall back to IP
    const identifier = userId ?? getClientIp(req);
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();

    const entry = store.get(key);

    // First request or window expired — reset
    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return null; // allowed
    }

    // Within window — increment
    entry.count += 1;

    if (entry.count > max) {
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

// Public room chat — prevents message flooding
export const roomChatLimiter = rateLimit({
  keyPrefix: "room_chat",
  windowMs: 60 * 1000, // 1 minute
  max: 30,
});

// Direct messages
export const dmLimiter = rateLimit({
  keyPrefix: "dm",
  windowMs: 60 * 1000,
  max: 60,
});

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

// Cleanup stale entries every 10 minutes to prevent memory leak
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key);
    }
  },
  10 * 60 * 1000
);
