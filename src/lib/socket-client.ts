"use client";

// One Socket.IO connection per browser tab, shared by every feature that
// needs real-time updates (notifications bell, public chat, DMs, members
// presence). Before this, each of those opened its own connection — up to
// three sockets per tab, three heartbeats, three presence entries. On a
// cheap phone on mobile data that's real battery and bandwidth.
//
// Usage: `const socket = useSocket(userId)` in a client component. Every
// consumer MUST:
//   • register listeners with socket.on(event, handler) and remove them with
//     socket.off(event, SAME handler) on cleanup — never socket.off(event)
//     with no handler, that would remove other features' listeners;
//   • (re)join its server-side rooms both immediately (if already connected)
//     and on every "connect" event (reconnects lose room membership);
//   • leave its rooms on cleanup (room:leave / dm:leave / presence:leave),
//     because the shared socket stays connected after the component unmounts.

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

// Keep the connection alive briefly after the last user releases it, so a
// route change (old page unmounts, new page mounts) doesn't drop and redial.
const RELEASE_GRACE_MS = 4000;
// After the server rejects the handshake (usually an expired access token),
// refresh the session and retry — but not forever.
const MAX_AUTH_RETRIES = 3;

let socket: Socket | null = null;
let socketUserId: string | null = null;
let refCount = 0;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;
let authRetries = 0;
let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch("/api/auth/refresh", { method: "POST" })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

function createSocket(): Socket {
  const s = io({ withCredentials: true });

  s.on("connect", () => {
    authRetries = 0;
  });

  // Socket.IO does NOT auto-retry when the server's auth middleware rejects
  // the connection (socket.active === false). That happens when the 15-min
  // access token expired while the tab was open. Refresh the cookie, then
  // reconnect; give up after a few attempts.
  s.on("connect_error", () => {
    if (s.active || authRetries >= MAX_AUTH_RETRIES) return;
    authRetries += 1;
    refreshSession().then((ok) => {
      if (ok && socket === s && refCount > 0) {
        setTimeout(() => s.connect(), 1000 * authRetries);
      }
    });
  });

  return s;
}

function teardown() {
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  socket?.disconnect();
  socket?.removeAllListeners();
  socket = null;
  socketUserId = null;
  authRetries = 0;
}

/** Take a reference to the tab's shared socket (creates it if needed). */
export function acquireSocket(userId: string): Socket {
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  // A different account in the same tab (logout → login) needs a fresh
  // handshake — the old connection is authenticated as the old user.
  if (socket && socketUserId !== userId) {
    teardown();
  }
  if (!socket) {
    socket = createSocket();
    socketUserId = userId;
  }
  refCount += 1;
  return socket;
}

/** Drop a reference; the connection closes shortly after the last one. */
export function releaseSocket(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && !releaseTimer) {
    releaseTimer = setTimeout(() => {
      releaseTimer = null;
      if (refCount === 0) teardown();
    }, RELEASE_GRACE_MS);
  }
}

/**
 * The shared socket for a logged-in user, or null for guests / until mounted.
 * Pass `null` as userId to opt out (e.g. a logged-out visitor).
 */
export function useSocket(userId: string | null | undefined): Socket | null {
  const [instance, setInstance] = useState<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;
    const s = acquireSocket(userId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hand the shared instance to this component
    setInstance(s);
    return () => {
      setInstance(null);
      releaseSocket();
    };
  }, [userId]);

  return userId ? instance : null;
}

/**
 * Runs `join` now if connected and again after every reconnect — the server
 * forgets room membership when a connection drops.
 * Returns a cleanup that stops re-joining (call your leave emit yourself).
 */
export function onConnected(s: Socket, join: () => void): () => void {
  if (s.connected) join();
  s.on("connect", join);
  return () => {
    s.off("connect", join);
  };
}
