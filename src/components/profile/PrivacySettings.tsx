"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Alert from "@/components/ui/Alert";
import SwitchRow from "@/components/ui/Switch";

interface Privacy {
  showEmail: boolean;
  showPhone: boolean;
  showGender: boolean;
  showAddress: boolean;
  showInterests: boolean;
  showDOB: boolean;
}

interface PrivacySettingsProps {
  initialPrivacy: Privacy;
}

const FIELDS = [
  { key: "showEmail", label: "Email address", description: "Show your email on your public profile" },
  { key: "showPhone", label: "Phone number", description: "Show your phone on your public profile" },
  { key: "showGender", label: "Gender", description: "Show your gender on your public profile" },
  { key: "showAddress", label: "Area in Dehradun", description: "Show where you live on your public profile" },
  { key: "showInterests", label: "Interests", description: "Show your interests on your public profile" },
  { key: "showDOB", label: "Date of birth", description: "Show your birthday on your public profile" },
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
    <div className="flex flex-col gap-2.5">
      {error && <Alert type="error" message={error} />}

      {FIELDS.map((field) => {
        const isOn = privacy[field.key];
        return (
          <SwitchRow
            key={field.key}
            label={field.label}
            description={field.description}
            checked={isOn}
            onChange={() => toggle(field.key)}
            saving={saving === field.key}
            icon={isOn ? <Eye size={19} /> : <EyeOff size={19} />}
          />
        );
      })}
    </div>
  );
}
