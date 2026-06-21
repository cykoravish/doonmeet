"use client";

import { useState } from "react";
import { MapPin, Loader2, EyeOff, Eye, X } from "lucide-react";
import Button from "@/components/ui/Button";

interface CheckInButtonProps {
  hasCheckedIn: boolean;
  isVisible: boolean;
  onCheckIn: (coords: { lat: number; lng: number }, label: string | null) => void;
  onToggleVisibility: (visible: boolean) => void;
  onRemove: () => void;
}

export default function CheckInButton({
  hasCheckedIn,
  isVisible,
  onCheckIn,
  onToggleVisibility,
  onRemove,
}: CheckInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("");
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckIn() {
    setLoading(true);
    setError("");

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      );

      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      onCheckIn(coords, label.trim() || null);
      setShowLabelInput(false);
      setLabel("");
    } catch {
      setError("Could not get your location. Please allow location access.");
    } finally {
      setLoading(false);
    }
  }

  if (hasCheckedIn) {
    return (
      <div
        className="rounded-2xl border p-4 space-y-3"
        style={{
          borderColor: "rgb(var(--border))",
          backgroundColor: "rgb(var(--surface))",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full animate-pulse"
            style={{ backgroundColor: "rgb(var(--primary))" }}
          />
          <p className="text-sm font-semibold">You&apos;re on the map!</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onToggleVisibility(!isVisible)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
            {isVisible ? "Hide me" : "Show me"}
          </button>
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            <MapPin size={13} />
            Update location
          </button>
          <button
            onClick={onRemove}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs transition-opacity hover:opacity-80"
            style={{ borderColor: "rgb(220 38 38 / 0.3)", color: "rgb(220 38 38)" }}
          >
            <X size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{
        borderColor: "rgb(var(--border))",
        backgroundColor: "rgb(var(--surface))",
      }}
    >
      <div>
        <p className="text-sm font-bold">Share your location</p>
        <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          Let others see you on the map
        </p>
      </div>

      {showLabelInput && (
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Optional: I'm at Clock Tower..."
          maxLength={100}
          className="w-full rounded-xl border px-3 py-2 text-xs outline-none"
          style={{
            backgroundColor: "rgb(var(--background))",
            borderColor: "rgb(var(--border))",
            color: "rgb(var(--text))",
          }}
        />
      )}

      {error && (
        <p className="text-xs" style={{ color: "rgb(220 38 38)" }}>{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setShowLabelInput(!showLabelInput)}
          className="rounded-xl border px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
        >
          {showLabelInput ? "No label" : "Add label"}
        </button>
        <Button loading={loading} onClick={handleCheckIn} className="flex-1 py-2 text-xs">
          <MapPin size={13} />
          Check in
        </Button>
      </div>
    </div>
  );
}