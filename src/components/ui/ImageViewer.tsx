"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";

/**
 * Call from the click that opens the viewer (NOT from an effect — React's
 * dev double-effects would push/pop twice). Adds a history entry so the
 * phone's Back button closes the photo instead of leaving the page.
 */
export function pushViewerHistory() {
  window.history.pushState({ ...(window.history.state ?? {}), photoViewer: true }, "");
}

interface ImageViewerProps {
  src: string;
  alt: string;
  /** Optional line shown top-left (e.g. the person's name for a profile photo). */
  caption?: string;
  /** Called after Back / ✕ / Esc / backdrop tap — unmount the viewer. */
  onClose: () => void;
}

// Full-screen photo viewer. Every way of closing goes through history.back(),
// so the history entry added by pushViewerHistory() is always consumed and
// the popstate listener below is the single place that closes it.
// Pinch-to-zoom is the browser's own.
export default function ImageViewer({ src, alt, caption, onClose }: ImageViewerProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const onPop = () => onCloseRef.current();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.history.back();
    };
    window.addEventListener("popstate", onPop);
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  const close = () => window.history.back();

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Photo" className="fixed inset-0 z-[110] bg-black" onClick={close}>
      <div className="absolute inset-0">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="100vw"
          className="object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      {caption && (
        <p className="pointer-events-none absolute top-[max(0.75rem,env(safe-area-inset-top))] right-16 left-4 h-11 truncate text-base leading-11 font-bold text-white">
          {caption}
        </p>
      )}
      <button
        ref={closeBtnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        aria-label="Close photo"
        className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
      >
        <X size={22} aria-hidden="true" />
      </button>
    </div>,
    document.body
  );
}
