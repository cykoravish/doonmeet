"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/providers/toast-provider";

interface ProfileBannerProps {
  bannerImage: string | null;
  editable?: boolean;
}

// Full-width banner on the public profile page. Editable only for the
// profile owner — hover reveals a camera affordance, same interaction
// pattern as ProfileAvatar. No banner set yet falls back to the themed
// decorative gradient instead of a blank/plain block.
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
    <div className="group relative h-40 overflow-hidden sm:h-52 md:h-60 bg-gradient-to-br from-primary via-primary to-primary-light">
      {displaySrc ? (
        <Image src={displaySrc} alt="Profile banner" fill priority className="object-cover" />
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 400 160"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <path
            d="M0,40 C60,10 100,55 160,35 C220,15 260,50 320,30 C350,20 380,35 400,25 V0 H0 Z"
            fill="rgb(255 255 255 / 0.10)"
          />
          <path
            d="M0,80 C50,60 110,95 170,75 C230,55 270,90 330,70 C360,60 385,72 400,65 V0 H0 Z"
            fill="rgb(255 255 255 / 0.07)"
          />
          <path
            d="M0,120 C55,100 115,130 175,112 C235,94 275,125 335,108 C365,99 385,110 400,104 V0 H0 Z"
            fill="rgb(255 255 255 / 0.05)"
          />
        </svg>
      )}

      {/* Soft bottom fade so the avatar ring transitions in cleanly */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent" />

      {editable && (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            aria-label={displaySrc ? "Change banner image" : "Add a banner image"}
            className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100 focus-visible:bg-black/30 focus-visible:opacity-100"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                <Camera size={14} />
                {displaySrc ? "Change banner" : "Add a banner"}
              </span>
            )}
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
