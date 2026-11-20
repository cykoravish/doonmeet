"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ImagePlus, X, Loader2, Send } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { buttonClasses } from "@/components/ui/Button";
import { compressImage } from "@/lib/imageCompression";

interface CreatePostFormProps {
  currentUser: { _id: string; name: string; avatar: string | null };
  onPosted?: () => void;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_LENGTH = 3000;

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

  const remaining = MAX_LENGTH - content.length;

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <Avatar name={currentUser.name} src={currentUser.avatar} size={40} />
        <div className="leading-tight">
          <p className="font-bold text-text">{currentUser.name}</p>
          <p className="text-[13px] text-muted">Posting to everyone in Dehradun</p>
        </div>
      </div>

      <label htmlFor="create-post-content" className="sr-only">
        Post text
      </label>
      <textarea
        id="create-post-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Kya chal raha hai Doon mein? Share a job, an event, a question…"
        rows={5}
        maxLength={MAX_LENGTH}
        autoFocus
        className="min-h-32 w-full resize-none rounded-[16px] border-[1.5px] border-transparent bg-surface-2 px-4 py-3 text-base leading-relaxed text-text outline-none placeholder:text-muted focus:border-primary focus:bg-surface"
      />

      {compressing && (
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Optimizing image…
        </p>
      )}

      {imagePreview && !compressing && (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-surface-2">
          <Image src={imagePreview} alt="Selected image preview" fill className="object-cover" unoptimized />
          <button
            type="button"
            onClick={removeImage}
            aria-label="Remove image"
            className="absolute top-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
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
          className="flex h-11 cursor-pointer items-center gap-2 rounded-[14px] bg-primary-soft px-3.5 text-[15px] font-semibold text-primary-fg"
        >
          <ImagePlus size={19} aria-hidden="true" />
          {imageFile ? "Change photo" : "Add photo"}
        </label>

        <div className="flex items-center gap-3">
          {remaining < 200 && (
            <span className={`text-sm ${remaining < 50 ? "text-danger" : "text-muted"}`}>{remaining}</span>
          )}
          <button
            type="submit"
            disabled={posting || compressing || !content.trim()}
            className={buttonClasses("primary", "md", "px-6")}
          >
            {posting ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <Send size={17} aria-hidden="true" />
            )}
            Post
          </button>
        </div>
      </div>
    </form>
  );
}
