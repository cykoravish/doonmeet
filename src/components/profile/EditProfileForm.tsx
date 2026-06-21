"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

interface ProfileData {
  name: string;
  bio: string;
  gender: string;
  address: string;
  interests: string[];
  phone: string;
}

interface EditProfileFormProps {
  initialData: ProfileData;
  onSuccess: (updated: ProfileData) => void;
}

const INTERESTS = [
  "Tech", "Nature", "Food", "Photography",
  "Sports", "Arts", "Music", "Travel",
  "Books", "Gaming",
];

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export default function EditProfileForm({
  initialData,
  onSuccess,
}: EditProfileFormProps) {
  const [form, setForm] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function toggleInterest(interest: string) {
    const lower = interest.toLowerCase();
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(lower)
        ? prev.interests.filter((i) => i !== lower)
        : [...prev.interests, lower].slice(0, 10),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          bio: form.bio,
          gender: form.gender || undefined,
          address: form.address,
          interests: form.interests,
          phone: form.phone || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to update profile.");
        return;
      }

      setSuccess("Profile updated!");
      onSuccess(form);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <Input
        label="Full Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
        maxLength={50}
      />

      {/* Bio */}
      <div>
        <p className="mb-1 text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>
          Bio
        </p>
        <textarea
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Tell people about yourself..."
          rows={3}
          maxLength={300}
          className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-all"
          style={{
            backgroundColor: "rgb(var(--surface))",
            borderColor: "rgb(var(--border))",
            color: "rgb(var(--text))",
          }}
        />
        <p className="text-right text-xs" style={{ color: "rgb(var(--muted))" }}>
          {form.bio.length}/300
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Gender */}
        <div>
          <p className="mb-1 text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>
            Gender
          </p>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
            style={{
              backgroundColor: "rgb(var(--surface))",
              borderColor: "rgb(var(--border))",
              color: "rgb(var(--text))",
            }}
          >
            <option value="">Prefer not to say</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        <Input
          label="Phone (private by default)"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+91 98765 43210"
        />
      </div>

      <Input
        label="Address / Area in Dehradun"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        placeholder="e.g. Rajpur Road, Dehradun"
        maxLength={100}
      />

      {/* Interests */}
      <div>
        <p className="mb-2 text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>
          Interests (max 10)
        </p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => {
            const active = form.interests.includes(interest.toLowerCase());
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className="rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all"
                style={{
                  backgroundColor: active ? "rgb(var(--primary))" : "transparent",
                  borderColor: active ? "rgb(var(--primary))" : "rgb(var(--border))",
                  color: active ? "white" : "rgb(var(--muted))",
                }}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      <Button type="submit" loading={loading}>
        Save Changes
      </Button>
    </form>
  );
}