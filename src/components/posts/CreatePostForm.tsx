"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ImagePlus, X, Loader2, Send } from "lucide-react";
import { Avatar } from "./PostCard";
import { compressImage } from "@/lib/imageCompression";

interface CreatePostFormProps {
  currentUser: { _id: string; name: string; avatar: string | null };
  onPosted?: () => void;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function CreatePostForm({ currentUser, onPosted }: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [compressing, setCompressing] = useState(false);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG and WebP images are allowed.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError("");
    setCompressing(true);
    const compressed = await compressImage(file);
    setCompressing(false);

    setImageFile(compressed);
    setImagePreview(URL.createObjectURL(compressed));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setPosting(true);
    setError("");

    const formData = new FormData();
    formData.append("content", content.trim());
    if (imageFile) formData.append("image", imageFile);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Something went wrong.");
        setPosting(false);
        return;
      }

      setContent("");
      removeImage();
      onPosted?.();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="overflow-hidden rounded-2xl border border-t-2 p-4 sm:p-5"
      style={{
        borderColor: "rgb(var(--border))",
        borderTopColor: "rgb(var(--accent))",
        backgroundColor: "rgb(var(--surface))",
      }}
    >
      <div className="flex gap-3">
        <Avatar name={currentUser.name} avatar={currentUser.avatar} size={44} />
        <div className="min-w-0 flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share a job, an event, something fun..."
            rows={3}
            maxLength={3000}
            className="w-full resize-none rounded-xl border px-4 py-3 text-base outline-none sm:text-sm"
            style={{ backgroundColor: "rgb(var(--background))", borderColor: "rgb(var(--border))" }}
          />

          {compressing && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: "rgb(var(--muted))" }}>
              <Loader2 size={12} className="animate-spin" /> Optimizing image...
            </p>
          )}

          {imagePreview && !compressing && (
            <div className="relative mt-2 h-48 w-full overflow-hidden rounded-xl sm:h-56">
              <Image src={imagePreview} alt="Selected image preview" fill className="object-cover" />
              <button
                type="button"
                onClick={removeImage}
                aria-label="Remove image"
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-opacity active:opacity-70"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {error && (
            <p className="mt-1.5 text-xs" style={{ color: "rgb(220 38 38)" }}>
              {error}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelect}
              className="hidden"
              id="post-image-input"
            />
            <label
              htmlFor="post-image-input"
              className="flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors active:opacity-70"
              style={{ backgroundColor: "rgb(var(--primary) / 0.1)", color: "rgb(var(--primary))" }}
            >
              <ImagePlus size={15} />
              {imageFile ? "Change" : "Add image"}
            </label>

            <button
              type="submit"
              disabled={posting || compressing || !content.trim()}
              className="btn-springy flex min-h-[40px] items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: "rgb(var(--primary))" }}
            >
              {posting ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
              Post
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
