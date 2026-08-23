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
