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
  occupation: string;
  website: string;
  dob: string;
  lookingFor: string;
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

const LOOKING_FOR_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "working_professional", label: "Working Professional" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "new_to_dehradun", label: "New to Dehradun" },
  { value: "just_exploring", label: "Just Exploring" },
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
          gender: form.gender || null,
          address: form.address,
          interests: form.interests,
          phone: form.phone || null,
          occupation: form.occupation,
          website: form.website,
          dob: form.dob || null,
          lookingFor: form.lookingFor || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Prefer the specific field-level reason over the generic message
        const fieldError = data.errors?.[0]?.message;
        setError(fieldError || data.message || "Failed to update profile.");
        return;
      }

      // Use the server's persisted values (not the optimistic local form
      // state) so the UI always reflects what actually got saved to the DB.
      const saved = data.user ?? {};
      const normalized: ProfileData = {
        name: saved.name ?? form.name,
        bio: saved.bio ?? "",
        gender: saved.gender ?? "",
        address: saved.address ?? "",
        interests: saved.interests ?? [],
        phone: saved.phone ?? "",
        occupation: saved.occupation ?? "",
        website: saved.website ?? "",
        dob: saved.dob ? String(saved.dob).split("T")[0] : "",
        lookingFor: saved.lookingFor ?? "",
      };

      setForm(normalized);
      setSuccess("Profile updated!");
      onSuccess(normalized);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <Input
        label="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
        maxLength={50}
      />

      {/* Bio */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-bio" className="text-sm font-semibold text-text">
          Bio
        </label>
        <textarea
          id="profile-bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Tell people about yourself..."
          rows={3}
          maxLength={300}
          className="w-full resize-none rounded-[14px] border-[1.5px] border-transparent bg-surface-2 px-4 py-3 text-base leading-relaxed text-text outline-none placeholder:text-muted focus:border-primary focus:bg-surface"
        />
        <p className="text-right text-sm text-muted">{form.bio.length}/300</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Gender */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-gender" className="text-sm font-semibold text-text">
            Gender
          </label>
          <select
            id="profile-gender"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="h-12 w-full rounded-[14px] border-[1.5px] border-transparent bg-surface-2 px-3 text-base text-text outline-none focus:border-primary"
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
        label="Area in Dehradun"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        placeholder="e.g. Rajpur Road, Dehradun"
        maxLength={100}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Occupation"
          value={form.occupation}
          onChange={(e) => setForm({ ...form, occupation: e.target.value })}
          placeholder="e.g. Software Engineer"
          maxLength={60}
        />

        <Input
          label="Date of birth"
          type="date"
          value={form.dob}
          onChange={(e) => setForm({ ...form, dob: e.target.value })}
          max={new Date().toISOString().split("T")[0]}
        />
      </div>

      <Input
        label="Website or social link"
        type="url"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
        placeholder="https://instagram.com/yourhandle"
        maxLength={150}
      />

      {/* Looking for */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-looking-for" className="text-sm font-semibold text-text">
          What best describes you?
        </label>
        <select
          id="profile-looking-for"
          value={form.lookingFor}
          onChange={(e) => setForm({ ...form, lookingFor: e.target.value })}
          className="h-12 w-full rounded-[14px] border-[1.5px] border-transparent bg-surface-2 px-3 text-base text-text outline-none focus:border-primary"
        >
          <option value="">Prefer not to say</option>
          {LOOKING_FOR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Interests */}
      <div>
        <p id="profile-interests-label" className="mb-2 text-sm font-semibold text-text">
          Interests <span className="font-normal text-muted">(up to 10)</span>
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="profile-interests-label">
          {INTERESTS.map((interest) => {
            const active = form.interests.includes(interest.toLowerCase());
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                aria-pressed={active}
                className={`h-10 rounded-full px-4 text-sm font-semibold capitalize transition-colors ${
                  active ? "bg-primary text-on-primary" : "bg-surface-2 text-text hover:bg-border"
                }`}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      <Button type="submit" size="lg" loading={loading}>
        Save changes
      </Button>
    </form>
  );
}