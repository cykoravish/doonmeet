"use client";

import { useId } from "react";
import { Loader2 } from "lucide-react";

interface SwitchRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  /** Shows a spinner instead of the switch while the change is saving. */
  saving?: boolean;
  icon?: React.ReactNode;
}

// A settings row with an accessible on/off switch (role="switch"). The whole
// row is the tap target, not just the small switch.
export default function SwitchRow({ label, description, checked, onChange, disabled, saving, icon }: SwitchRowProps) {
  const id = useId();

  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-border bg-surface p-3.5">
      {icon && (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
            checked ? "bg-primary-soft text-primary-fg" : "bg-surface-2 text-muted"
          }`}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block text-[15px] font-semibold text-text">{label}</span>
        {description && <span className="block text-sm text-muted">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        disabled={disabled || saving}
        className="flex h-11 w-14 shrink-0 items-center justify-center disabled:opacity-60"
      >
        {saving ? (
          <Loader2 size={18} className="animate-spin text-muted" aria-hidden="true" />
        ) : (
          <span
            className={`relative h-7 w-12 rounded-full transition-colors ${checked ? "bg-primary" : "bg-border"}`}
            aria-hidden="true"
          >
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                checked ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </span>
        )}
      </button>
    </div>
  );
}
