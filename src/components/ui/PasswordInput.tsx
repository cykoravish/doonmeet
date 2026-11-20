"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  hint?: string;
  error?: string;
}

// Password field with a 44px show/hide toggle inside it. Pass
// autoComplete="current-password" (login) or "new-password" (signup/reset)
// so phones offer saved / generated passwords.
export default function PasswordInput({ label, hint, error, id, className = "", ...props }: PasswordInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [visible, setVisible] = useState(false);
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-text">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-12 w-full rounded-[14px] border-[1.5px] bg-surface-2 pr-12 pl-4 text-base text-text outline-none placeholder:text-muted focus:border-primary focus:bg-surface ${
            error ? "border-danger" : "border-transparent"
          } ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute top-0.5 right-0.5 flex h-11 w-11 items-center justify-center rounded-[12px] text-muted hover:text-text"
        >
          {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
        </button>
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${inputId}-hint`} className="text-sm text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
