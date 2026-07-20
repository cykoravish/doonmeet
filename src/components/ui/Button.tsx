"use client";

import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  loading?: boolean;
  children: React.ReactNode;
}

export default function Button({
variant = "primary",
  loading = false,
  children,
  className = "w-full",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-opacity disabled:opacity-50";

  const variants = {
    primary: {
      backgroundColor: "rgb(var(--primary))",
      color: "white",
    },
    outline: {
      border: "1px solid rgb(var(--border))",
      color: "rgb(var(--text))",
    },
    ghost: {
      color: "rgb(var(--muted))",
    },
  };

  return (
    <button
      className={`${base} ${className} hover:opacity-85`}
      style={variants[variant]}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}