"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Alert from "@/components/ui/Alert";
import SwitchRow from "@/components/ui/Switch";
import { useToast } from "@/providers/toast-provider";

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
  {
    key: "showDOB",
    label: "Birthday",
    description: "Show the day and month on your profile (your birth year always stays hidden)",
  },
] as const;

export default function PrivacySettings({ initialPrivacy }: PrivacySettingsProps) {
  const [privacy, setPrivacy] = useState(initialPrivacy);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  async function toggle(key: keyof Privacy) {
    const label = FIELDS.find((f) => f.key === key)?.label ?? "Setting";
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
        const message = data?.message || "Couldn't save this setting. Please try again.";
        setError(message);
        showToast(message, "error");
      } else {
        showToast(
          `${label} is now ${newValue ? "visible on" : "hidden from"} your profile`,
          "success"
        );
      }
    } catch {
      setPrivacy((prev) => ({ ...prev, [key]: !newValue }));
      setError("No internet connection. Please try again.");
      showToast("No internet connection. Please try again.", "error");
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
