"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/providers/toast-provider";
import { compressImage } from "@/lib/imageCompression";

interface ProfileBannerProps {
  bannerImage: string | null;
  editable?: boolean;
  /** Size / corner classes — defaults to the full-width public-profile cover. */
  className?: string;
}

// Cover photo on the public profile page and the /profile header. Owners get
// an always-visible "Add cover photo" pill (a hover-only control is invisible
// on phones). No cover yet → a static ridge silhouette on the brand green.
export default function ProfileBanner({
  bannerImage,
  editable = false,
  className = "h-36 sm:h-52 md:rounded-b-[24px]",
}: ProfileBannerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const displaySrc = preview ?? bannerImage;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setPreview(URL.createObjectURL(picked));
    setLoading(true);

    try {
      // Phone photos are often bigger than the 6 MB limit — shrink first.
      const file = await compressImage(picked, { maxDimension: 1600 });
      const formData = new FormData();
      formData.append("banner", file);

      const res = await fetch("/api/users/banner", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.bannerImage) {
        showToast("Cover photo updated", "success");
      } else {
        setPreview(null);
        showToast(data.message || "Couldn't update your cover photo.", "error");
      }
    } catch {
      setPreview(null);
      showToast("No internet connection. Please try again.", "error");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={`relative overflow-hidden bg-primary ${className}`}>
      {displaySrc ? (
        <Image src={displaySrc} alt="" fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 390 120"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-3/4 w-full fill-on-primary opacity-15"
        >
          <path d="M0 120 L0 80 L60 40 L95 62 L160 16 L215 58 L250 38 L330 80 L390 50 L390 120 Z" />
        </svg>
      )}

      {editable && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="absolute top-3 right-3 flex h-10 items-center gap-1.5 rounded-full bg-black/55 px-3.5 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-black/70 disabled:opacity-80"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Camera size={16} aria-hidden="true" />
            )}
            {loading ? "Uploading…" : displaySrc ? "Change cover" : "Add cover photo"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
        </>
      )}
    </div>
  );
}
