"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps the chat page's outer shell locked to the actual visible viewport
 * height at all times.
 *
 * `100dvh` alone should handle this, but on-screen keyboards expose a real
 * bug on several mobile browsers (notably Android Chrome and in-app
 * webviews): after the keyboard is dismissed, the layout viewport doesn't
 * always get recomputed back to its original height, leaving stale extra
 * space at the bottom that becomes scrollable — which is exactly the "gap
 * above the nav bar" reported.
 *
 * `window.visualViewport` reports the *actual* visible height at all times
 * and fires a `resize` event on every keyboard open/close and orientation
 * change, so re-reading it and applying it directly keeps this shell
 * perfectly in sync regardless of any browser's dvh quirks.
 */
export default function ChatViewportShell({ children }: { children: React.ReactNode }) {
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const vv = window.visualViewport;

    // Lock document scrolling while chat is mounted. Without this, a touch
    // drag on a non-scrollable area (input bar, tabs row) scrolls the whole
    // document — body is taller than this shell on Android Chrome because
    // 100vh there ignores the address bar — sliding the shell up and
    // exposing an empty strip above the fixed bottom nav.
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
    };
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    window.scrollTo(0, 0);

    function syncHeight() {
      const height = vv?.height ?? window.innerHeight;
      el!.style.height = `${height}px`;
    }

    syncHeight();

    vv?.addEventListener("resize", syncHeight);
    window.addEventListener("orientationchange", syncHeight);
    // Fallback for the rare browser without the visualViewport API.
    window.addEventListener("resize", syncHeight);

    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      body.style.overflow = prev.bodyOverflow;
      body.style.overscrollBehavior = prev.bodyOverscroll;
      vv?.removeEventListener("resize", syncHeight);
      window.removeEventListener("orientationchange", syncHeight);
      window.removeEventListener("resize", syncHeight);
    };
  }, []);

  return (
    <div ref={shellRef} className="flex flex-col overflow-hidden" style={{ height: "100dvh" }}>
      {children}
    </div>
  );
}
