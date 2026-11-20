"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, X, Loader2, Check } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { compressImage } from "@/lib/imageCompression";
import CategoryPicker from "./CategoryPicker";
import { DEFAULT_POST_CATEGORY, type PostCategory } from "@/lib/postCategories";

interface EditPostFormProps {
  postId: string;
  initialContent: string;
  initialImage: string | null;
  initialCategory?: PostCategory;
  onCancel: () => void;
  onSaved: (post: { content: string; image: string | null; category: PostCategory }) => void;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function EditPostForm({
  postId,
  initialContent,
  initialImage,
  initialCategory,
  onCancel,
  onSaved,
}: EditPostFormProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [category, setCategory] = useState<PostCategory>(initialCategory ?? DEFAULT_POST_CATEGORY);
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
    formData.append("category", category);
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

      onSaved({ content: data.post.content, image: data.post.image, category: data.post.category ?? category });
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-[20px] border border-border bg-surface p-4">
      <h1 className="text-xl font-extrabold">Edit post</h1>

      <label htmlFor={`edit-post-content-${postId}`} className="sr-only">
        Post text
      </label>
      <textarea
        id={`edit-post-content-${postId}`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        maxLength={3000}
        autoFocus
        className="w-full resize-none rounded-[16px] border-[1.5px] border-transparent bg-surface-2 px-4 py-3 text-base leading-relaxed text-text outline-none focus:border-primary focus:bg-surface"
      />

      <CategoryPicker value={category} onChange={setCategory} idPrefix={`edit-${postId}`} />

      {compressing && (
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Optimizing image…
        </p>
      )}

      {imagePreview && !compressing && (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-surface-2">
          <Image src={imagePreview} alt="Post image preview" fill sizes="672px" className="object-cover" />
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
        className="flex h-11 w-fit cursor-pointer items-center gap-2 rounded-[14px] bg-primary-soft px-3.5 text-[15px] font-semibold text-primary-fg"
      >
        <ImagePlus size={19} aria-hidden="true" />
        {imagePreview ? "Change photo" : "Add photo"}
      </label>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button type="button" onClick={onCancel} disabled={saving} className={buttonClasses("secondary", "md")}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || compressing || !content.trim()}
          className={buttonClasses("primary", "md")}
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : (
            <Check size={18} aria-hidden="true" />
          )}
          Save
        </button>
      </div>
    </form>
  );
}
