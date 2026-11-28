"use client";

import { useState, type ReactNode } from "react";
import ImageViewer, { pushViewerHistory } from "@/components/ui/ImageViewer";
import { fullSizeAvatarUrl } from "@/lib/avatarUrl";

interface PhotoViewButtonProps {
  /** The profile photo. Without one there's nothing to enlarge: children render as they are. */
  src: string | null | undefined;
  /** Whose photo — used for the button label and the viewer caption. */
  name: string;
  className?: string;
  children: ReactNode;
}

// Makes a profile photo tappable: opens it full screen (Back / ✕ / Esc closes).
// Works inside server components too — the photo itself is passed as children.
export default function PhotoViewButton({ src, name, className = "", children }: PhotoViewButtonProps) {
  const [open, setOpen] = useState(false);

  if (!src) return <>{children}</>;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          pushViewerHistory();
          setOpen(true);
        }}
        aria-label={`View ${name}'s photo`}
        className={`cursor-zoom-in rounded-full ${className}`}
      >
        {children}
      </button>
      {open && <ImageViewer src={fullSizeAvatarUrl(src)} alt={name} caption={name} onClose={() => setOpen(false)} />}
    </>
  );
}
