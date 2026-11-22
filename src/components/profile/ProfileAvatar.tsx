"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/providers/toast-provider";
import { compressImage } from "@/lib/imageCompression";

interface ProfileAvatarProps {
  avatar: string | null;
  name: string;
  editable?: boolean;
  /** Intrinsic resolution requested from the image source (not the visual size — see `className`). */
  size?: number;
  /** Tailwind size classes for the wrapper, e.g. "h-20 w-20 sm:h-24 sm:w-24" — lets the avatar shrink on mobile. */
  className?: string;
  onUpdate?: (url: string) => void;
}

export default function ProfileAvatar({
  avatar,
  name,
  editable = false,
  size = 160,
  className = "h-24 w-24",
  onUpdate,
}: ProfileAvatarProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setPreview(URL.createObjectURL(picked));
    setLoading(true);

    try {
      // Phone photos can be several MB — an avatar never needs more than this.
      const file = await compressImage(picked, { maxDimension: 640 });
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/users/avatar", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.avatar) {
        onUpdate?.(data.avatar);
        showToast("Profile photo updated!", "success");
      } else {
        // Roll back the preview — otherwise the old photo silently "looks" replaced.
        setPreview(null);
        showToast(data.message || "Couldn't update your photo.", "error");
      }
    } catch {
      setPreview(null);
      showToast("Network error while uploading photo.", "error");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const displaySrc = preview ?? avatar;

  return (
    <div className={`relative shrink-0 ${className}`}>
      {displaySrc ? (
        <Image
          src={displaySrc}
          alt={editable ? "" : name}
          width={size}
          height={size}
          sizes="96px"
          className="h-full w-full rounded-full border-4 border-surface object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full border-4 border-surface bg-primary-soft font-display font-extrabold text-primary-fg"
          style={{ fontSize: "clamp(1.5rem, 7vw, 2.25rem)" }}
          aria-hidden={editable || undefined}
        >
          {name[0]?.toUpperCase()}
        </div>
      )}

      {editable && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            aria-label={displaySrc ? "Change profile photo" : "Add a profile photo"}
            className="absolute inset-0 flex items-center justify-center rounded-full"
          >
            {loading && (
              <span className="flex h-full w-full items-center justify-center rounded-full bg-black/40">
                <Loader2 size={22} className="animate-spin text-white" aria-hidden="true" />
              </span>
            )}
          </button>

          {/* Always-visible camera badge — touch devices have no hover, so
              this is how people discover the photo is tappable. */}
          {!loading && (
            <span
              className="pointer-events-none absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-primary text-on-primary"
              aria-hidden="true"
            >
              <Camera size={15} />
            </span>
          )}

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
