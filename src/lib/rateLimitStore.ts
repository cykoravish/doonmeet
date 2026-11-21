// In-memory sliding-window counters, shared by the HTTP rate limiters
// (src/middleware/rateLimit.ts) and the Socket.IO handlers (src/lib/socket.ts).
//
// Keep this file free of any "next/…" import. The custom server
// (server.ts → src/lib/socket.ts) loads it before Next.js has set up its
// runtime, and pulling next/server in that early made every request crash
// ("Invariant: AsyncLocalStorage accessed in runtime where it is not available").

export interface RateLimitOptions {
  windowMs: number; // time window in milliseconds
  max: number; // max requests in window
  keyPrefix: string; // identifies the route/action
}

export interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix ms timestamp
}

// key: "prefix:ip" or "prefix:userId"
const store = new Map<string, RateLimitEntry>();

/** Counts one hit for `key`; returns the window's entry and whether it's now over `max`. */
export function hit(key: string, windowMs: number, max: number): { entry: RateLimitEntry; limited: boolean } {
  const now = Date.now();
  const entry = store.get(key);

  // First request or window expired — reset
  if (!entry || now > entry.resetAt) {
    const fresh = { count: 1, resetAt: now + windowMs };
    store.set(key, fresh);
    return { entry: fresh, limited: false };
  }

  // Within window — increment
  entry.count += 1;
  return { entry, limited: entry.count > max };
}

/**
 * The same limits for code that isn't an HTTP route (the Socket.IO handlers),
 * e.g. `isRateLimited(ROOM_CHAT_LIMIT, userId)` — otherwise sending over the
 * socket would have no limit at all.
 */
export function isRateLimited(options: RateLimitOptions, identifier: string): boolean {
  return hit(`${options.keyPrefix}:${identifier}`, options.windowMs, options.max).limited;
}

// Public room chat — prevents message flooding (REST route + socket handler)
export const ROOM_CHAT_LIMIT: RateLimitOptions = {
  keyPrefix: "room_chat",
  windowMs: 60 * 1000, // 1 minute
  max: 30,
};

// Direct messages (REST route + socket handler)
export const DM_LIMIT: RateLimitOptions = {
  keyPrefix: "dm",
  windowMs: 60 * 1000,
  max: 60,
};

// Cleanup stale entries every 10 minutes to prevent memory leak
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key);
    }
  },
  10 * 60 * 1000
).unref?.();
