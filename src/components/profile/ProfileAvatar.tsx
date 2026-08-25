"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";

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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.avatar) {
        onUpdate?.(data.avatar);
      }
    } catch {
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  const displaySrc = preview ?? avatar;

  return (
    <div className={`relative shrink-0 ${className}`}>
      {displaySrc ? (
        <Image
          src={displaySrc}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full rounded-full border-4 object-cover shadow-md"
          style={{ borderColor: "rgb(var(--background))" }}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full border-4 font-bold text-white shadow-md"
          style={{
            backgroundColor: "rgb(var(--primary))",
            borderColor: "rgb(var(--background))",
            fontSize: "clamp(1.25rem, 7vw, 2rem)",
          }}
        >
          {name[0]?.toUpperCase()}
        </div>
      )}

      {/* Edit overlay */}
      {editable && (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            aria-label={displaySrc ? "Change profile photo" : "Add a profile photo"}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 active:opacity-100"
          >
            {loading && <Loader2 size={20} className="animate-spin text-white" />}
          </button>

          {/* Always-visible camera badge — hover-only affordances don't
              exist on touch devices, so this is how mobile users discover
              the avatar is tappable to change. */}
          {!loading && (
            <div
              className="pointer-events-none absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-sm"
              style={{
                backgroundColor: "rgb(var(--primary))",
                borderColor: "rgb(var(--background))",
              }}
            >
              <Camera size={13} className="text-white" />
            </div>
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