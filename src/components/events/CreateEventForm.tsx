"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

const TAGS = ["tech", "nature", "food", "photography", "sports", "arts", "general"];
const MAX_BANNER_SIZE = 5 * 1024 * 1024; // 5MB — matches the API limit
const BANNER_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Grouped card so the long form reads as a few short steps on a phone.
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-[20px] border border-border bg-surface p-4 sm:p-5">
      <legend className="sr-only">{title}</legend>
      <p className="text-lg font-extrabold" aria-hidden="true">
        {title}
      </p>
      {children}
    </fieldset>
  );
}

export default function CreateEventForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [myCommunities, setMyCommunities] = useState<{ _id: string; name: string; slug: string }[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState("");

  useEffect(() => {
    fetch("/api/communities/mine")
      .then((r) => r.json())
      .then((d) => setMyCommunities(d.communities ?? []))
      .catch(() => {});
  }, []);

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
    if (!BANNER_TYPES.includes(file.type)) {
      setError("Banner must be a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BANNER_SIZE) {
      setError("Banner must be smaller than 5MB.");
      return;
    }
    setError("");
    setBanner(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 5)));
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
      if (selectedCommunity) {
        formData.append("community", JSON.stringify(selectedCommunity));
      }

      if (banner) formData.append("banner", banner);

      const res = await fetch("/api/events", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.errors?.[0]?.message ?? data.message ?? "Failed to create event.");
        window.scrollTo({ top: 0 });
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert type="error" message={error} />}

      <FormSection title="Basics">
        {/* Banner */}
        {bannerPreview ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[16px] bg-surface-2">
            <Image src={bannerPreview} alt="Banner preview" fill unoptimized className="object-cover" />
            <button
              type="button"
              onClick={() => {
                setBanner(null);
                setBannerPreview(null);
              }}
              aria-label="Remove banner"
              className="absolute top-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <label className="flex aspect-[16/9] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[16px] border-2 border-dashed border-border bg-surface-2 text-center transition-colors hover:border-primary">
            <ImagePlus size={28} className="text-primary-fg" aria-hidden="true" />
            <span className="text-[15px] font-semibold text-text">Add a banner photo</span>
            <span className="text-sm text-muted">Optional · JPEG, PNG or WebP · max 5MB</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleBanner} />
          </label>
        )}

        <Input
          label="Event title"
          placeholder="e.g. Sunday trek to Malsi"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          maxLength={100}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="event-description" className="text-sm font-semibold text-text">
            What&apos;s the plan?
          </label>
          <textarea
            id="event-description"
            placeholder="Where you'll meet, what to bring, who it's for…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            rows={5}
            maxLength={2000}
            className="w-full resize-none rounded-[14px] border-[1.5px] border-transparent bg-surface-2 px-4 py-3 text-base leading-relaxed text-text outline-none placeholder:text-muted focus:border-primary focus:bg-surface"
          />
          <p className="text-right text-sm text-muted">{form.description.length}/2000</p>
        </div>
      </FormSection>

      <FormSection title="When">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Starts"
            type="datetime-local"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <Input
            label="Ends (optional)"
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
          />
        </div>
      </FormSection>

      <FormSection title="Where">
        <Input
          label="Place name"
          placeholder="e.g. FRI main gate, Clock Tower"
          value={form.locationName}
          onChange={(e) => setForm({ ...form, locationName: e.target.value })}
        />
        <Input
          label="Address (optional)"
          placeholder="e.g. Rajpur Road, Dehradun"
          value={form.locationAddress}
          onChange={(e) => setForm({ ...form, locationAddress: e.target.value })}
        />
      </FormSection>

      <FormSection title="Extras">
        <Input
          label="Max people (optional)"
          hint="Leave blank for no limit."
          type="number"
          inputMode="numeric"
          placeholder="e.g. 20"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          min="1"
        />

        <div>
          <p className="mb-2 text-sm font-semibold text-text" id="event-tags-label">
            Tags <span className="font-normal text-muted">(up to 5)</span>
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="event-tags-label">
            {TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={active}
                  className={`h-10 rounded-full px-4 text-sm font-semibold capitalize transition-colors ${
                    active ? "bg-primary text-on-primary" : "bg-surface-2 text-text hover:bg-border"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {myCommunities.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="event-community" className="text-sm font-semibold text-text">
              Host it under a community (optional)
            </label>
            <select
              id="event-community"
              value={selectedCommunity}
              onChange={(e) => setSelectedCommunity(e.target.value)}
              className="h-12 w-full rounded-[14px] border-[1.5px] border-transparent bg-surface-2 px-3 text-base text-text outline-none focus:border-primary"
            >
              <option value="">None — just me</option>
              {myCommunities.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </FormSection>

      <Button type="submit" size="lg" loading={loading}>
        Publish event
      </Button>
    </form>
  );
}
