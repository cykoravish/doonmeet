"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

const TAGS = ["tech", "nature", "food", "photography", "sports", "arts", "general"];

export default function CreateEventForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    endsAt: "",
    capacity: "",
    locationName: "",
    locationAddress: "",
  });

  function handleBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBanner(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 5)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();

      // Append JSON fields as strings
      formData.append("title", JSON.stringify(form.title));
      formData.append("description", JSON.stringify(form.description));
      formData.append("date", JSON.stringify(new Date(form.date).toISOString()));
      if (form.endsAt) {
        formData.append("endsAt", JSON.stringify(new Date(form.endsAt).toISOString()));
      }
      if (form.capacity) {
        formData.append("capacity", JSON.stringify(parseInt(form.capacity)));
      }
      formData.append(
        "location",
        JSON.stringify({
          name: form.locationName,
          address: form.locationAddress,
        })
      );
      formData.append("tags", JSON.stringify(selectedTags));

      if (banner) formData.append("banner", banner);

      const res = await fetch("/api/events", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.errors?.[0]?.message ?? data.message ?? "Failed to create event.");
        return;
      }

      router.push(`/events/${data.event.slug}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert type="error" message={error} />}

      {/* Banner upload */}
      <div>
        <p className="mb-2 text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>
          Event Banner (optional)
        </p>
        {bannerPreview ? (
          <div className="relative h-48 w-full overflow-hidden rounded-2xl">
            <img src={bannerPreview} alt="Banner" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => { setBanner(null); setBannerPreview(null); }}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label
            className="flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-colors hover:opacity-80"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            <Upload size={24} style={{ color: "rgb(var(--muted))" }} />
            <span className="text-sm" style={{ color: "rgb(var(--muted))" }}>
              Click to upload banner
            </span>
            <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
              JPEG, PNG or WebP · Max 5MB
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleBanner}
            />
          </label>
        )}
      </div>

      {/* Title */}
      <Input
        label="Event Title *"
        placeholder="e.g. Doon Tech Meetup"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />

      {/* Description */}
      <div>
        <p className="mb-1 text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>
          Description *
        </p>
        <textarea
          placeholder="Tell people what this event is about..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
          rows={4}
          maxLength={2000}
          className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 resize-none"
          style={{
            backgroundColor: "rgb(var(--surface))",
            borderColor: "rgb(var(--border))",
            color: "rgb(var(--text))",
          }}
        />
        <p className="mt-1 text-right text-xs" style={{ color: "rgb(var(--muted))" }}>
          {form.description.length}/2000
        </p>
      </div>

      {/* Date & Time */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Start Date & Time *"
          type="datetime-local"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
        <Input
          label="End Date & Time (optional)"
          type="datetime-local"
          value={form.endsAt}
          onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
        />
      </div>

      {/* Location */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Location Name"
          placeholder="e.g. Clock Tower, FRI"
          value={form.locationName}
          onChange={(e) => setForm({ ...form, locationName: e.target.value })}
        />
        <Input
          label="Address"
          placeholder="e.g. Rajpur Road, Dehradun"
          value={form.locationAddress}
          onChange={(e) => setForm({ ...form, locationAddress: e.target.value })}
        />
      </div>

      {/* Capacity */}
      <Input
        label="Capacity (optional — leave blank for unlimited)"
        type="number"
        placeholder="e.g. 50"
        value={form.capacity}
        onChange={(e) => setForm({ ...form, capacity: e.target.value })}
        min="1"
      />

      {/* Tags */}
      <div>
        <p className="mb-2 text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>
          Tags (max 5)
        </p>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all"
                style={{
                  backgroundColor: active ? "rgb(var(--primary))" : "transparent",
                  borderColor: active ? "rgb(var(--primary))" : "rgb(var(--border))",
                  color: active ? "white" : "rgb(var(--muted))",
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <Button type="submit" loading={loading}>
        Publish Event
      </Button>
    </form>
  );
}