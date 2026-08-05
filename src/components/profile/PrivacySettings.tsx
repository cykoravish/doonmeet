"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Alert from "@/components/ui/Alert";

interface Privacy {
  showEmail: boolean;
  showPhone: boolean;
  showGender: boolean;
  showAddress: boolean;
  showInterests: boolean;
}

interface PrivacySettingsProps {
  initialPrivacy: Privacy;
}

const FIELDS = [
  { key: "showEmail", label: "Email address", description: "Show your email on your public profile" },
  { key: "showPhone", label: "Phone number", description: "Show your phone on your public profile" },
  { key: "showGender", label: "Gender", description: "Show your gender on your public profile" },
  { key: "showAddress", label: "Address / Area", description: "Show your location on your public profile" },
  { key: "showInterests", label: "Interests", description: "Show your interests on your public profile" },
] as const;

export default function PrivacySettings({ initialPrivacy }: PrivacySettingsProps) {
  const [privacy, setPrivacy] = useState(initialPrivacy);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function toggle(key: keyof Privacy) {
    const newValue = !privacy[key];
    setPrivacy((prev) => ({ ...prev, [key]: newValue }));
    setSaving(key);
    setError("");

    try {
      const res = await fetch("/api/users/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newValue }),
      });

      if (!res.ok) {
        setPrivacy((prev) => ({ ...prev, [key]: !newValue }));
        const data = await res.json().catch(() => null);
        setError(data?.message || "Failed to update privacy setting.");
      }
    } catch {
      setPrivacy((prev) => ({ ...prev, [key]: !newValue }));
      setError("Network error.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && <Alert type="error" message={error} />}

      {FIELDS.map((field) => {
        const isOn = privacy[field.key];
        const isSaving = saving === field.key;

        return (
          <div
            key={field.key}
            className="flex items-center justify-between rounded-xl border p-4"
            style={{
              borderColor: "rgb(var(--border))",
              backgroundColor: "rgb(var(--surface))",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: isOn
                    ? "rgb(var(--primary) / 0.1)"
                    : "rgb(var(--muted) / 0.1)",
                }}
              >
                {isOn ? (
                  <Eye size={14} style={{ color: "rgb(var(--primary))" }} />
                ) : (
                  <EyeOff size={14} style={{ color: "rgb(var(--muted))" }} />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{field.label}</p>
                <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                  {field.description}
                </p>
              </div>
            </div>

            {/* Toggle */}
            <button
              onClick={() => toggle(field.key)}
              disabled={isSaving}
              className="relative h-6 w-11 rounded-full transition-colors disabled:opacity-50"
              style={{
                backgroundColor: isOn
                  ? "rgb(var(--primary))"
                  : "rgb(var(--border))",
              }}
            >
              <div
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{
                  transform: isOn ? "translateX(20px)" : "translateX(2px)",
                }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}