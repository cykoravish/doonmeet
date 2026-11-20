"use client";

import { useTheme } from "@/providers/theme-provider";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isNight = mounted && resolvedTheme === "night";
  const label = isNight ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={() => setTheme(isNight ? "doon" : "night")}
      aria-label={label}
      title={label}
      aria-pressed={isNight}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-surface-2 text-text transition-colors hover:bg-border"
    >
      {/* Simple icon swap — no rotate/scale animation */}
      {isNight ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
    </button>
  );
}
