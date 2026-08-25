"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, X, Loader2, Check } from "lucide-react";
import { compressImage } from "@/lib/imageCompression";

interface EditPostFormProps {
  postId: string;
  initialContent: string;
  initialImage: string | null;
  onCancel: () => void;
  onSaved: (post: { content: string; image: string | null }) => void;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function EditPostForm({
  postId,
  initialContent,
  initialImage,
  onCancel,
  onSaved,
}: EditPostFormProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setImageRemoved(false);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    setError("");

    const formData = new FormData();
    formData.append("content", content.trim());
    if (imageFile) formData.append("image", imageFile);
    if (imageRemoved) formData.append("removeImage", "true");

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Something went wrong.");
        setSaving(false);
        return;
      }

      onSaved({ content: data.post.content, image: data.post.image });
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border p-4"
      style={{ borderColor: "rgb(var(--border))", backgroundColor: "rgb(var(--surface))" }}
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        maxLength={3000}
        autoFocus
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
          <Image src={imagePreview} alt="Post image preview" fill className="object-cover" />
          <button
            type="button"
            onClick={removeImage}
            aria-label="Remove image"
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white active:opacity-70"
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
          id={`edit-post-image-${postId}`}
        />
        <label
          htmlFor={`edit-post-image-${postId}`}
          className="flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium active:opacity-70"
          style={{ backgroundColor: "rgb(var(--primary) / 0.1)", color: "rgb(var(--primary))" }}
        >
          <ImagePlus size={15} />
          {imagePreview ? "Change" : "Add image"}
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="min-h-[40px] rounded-xl border px-4 text-sm font-semibold active:opacity-70 disabled:opacity-50"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || compressing || !content.trim()}
            className="flex min-h-[40px] items-center gap-1.5 rounded-xl px-5 text-sm font-semibold text-white active:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: "rgb(var(--primary))" }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Save
          </button>
        </div>
      </div>
    </form>
  );
}
