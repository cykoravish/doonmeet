"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";

interface ProfileAvatarProps {
  avatar: string | null;
  name: string;
  editable?: boolean;
  size?: number;
  onUpdate?: (url: string) => void;
}

export default function ProfileAvatar({
  avatar,
  name,
  editable = false,
  size = 96,
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

      const res = await fetch("/api/users/me/avatar", {
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
    <div className="relative" style={{ width: size, height: size }}>
      {displaySrc ? (
        <Image
          src={displaySrc}
          alt={name}
          width={size}
          height={size}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full text-white font-bold"
          style={{
            width: size,
            height: size,
            backgroundColor: "rgb(var(--primary))",
            fontSize: size * 0.35,
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
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin text-white" />
            ) : (
              <Camera size={20} className="text-white" />
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