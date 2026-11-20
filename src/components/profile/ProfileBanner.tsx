"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/providers/toast-provider";

interface ProfileBannerProps {
  bannerImage: string | null;
  editable?: boolean;
}

// Banner on the public profile page. Owners get an always-visible "Edit"
// pill (a hover-only control is invisible on phones). No banner yet → a
// static ridge silhouette on the brand green.
export default function ProfileBanner({ bannerImage, editable = false }: ProfileBannerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const displaySrc = preview ?? bannerImage;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("banner", file);

      const res = await fetch("/api/users/banner", { method: "POST", body: formData });
      const data = await res.json();

      if (res.ok && data.bannerImage) {
        showToast("Banner updated!", "success");
      } else {
        setPreview(null);
        showToast(data.message || "Failed to update banner.", "error");
      }
    } catch {
      setPreview(null);
      showToast("Network error while uploading banner.", "error");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="relative h-36 overflow-hidden bg-primary sm:h-52 md:rounded-b-[24px]">
      {displaySrc ? (
        <Image src={displaySrc} alt="" fill priority sizes="100vw" className="object-cover" />
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
            className="absolute right-3 bottom-3 flex h-10 items-center gap-1.5 rounded-full bg-black/55 px-3.5 text-sm font-semibold text-white"
          >
            {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
            {displaySrc ? "Change banner" : "Add banner"}
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
