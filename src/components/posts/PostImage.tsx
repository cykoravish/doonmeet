"use client";

import { useState } from "react";
import Image from "next/image";
import ImageViewer, { pushViewerHistory } from "./ImageViewer";
import { photoLayout } from "./photoLayout";

interface PostImageProps {
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  /** True only for the page's main (LCP) image — the post detail page. */
  priority?: boolean;
}

// A post photo in its real shape (see photoLayout). Tap → full screen.
export default function PostImage({ src, alt, width, height, priority = false }: PostImageProps) {
  const [open, setOpen] = useState(false);
  const { aspectRatio, fit } = photoLayout(width, height);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          pushViewerHistory();
          setOpen(true);
        }}
        aria-label="Open photo full screen"
        className="relative block w-full cursor-zoom-in bg-surface-2"
        style={{ aspectRatio }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 672px) 100vw, 672px"
          className={fit === "cover" ? "object-cover" : "object-contain"}
        />
      </button>
      {open && <ImageViewer src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
