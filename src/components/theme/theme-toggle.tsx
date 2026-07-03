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

  if (!mounted) {
    return (
      <button className="relative h-9 w-9 rounded-lg border border-border" aria-label="Toggle theme">
        <Moon size={16} className="absolute inset-0 m-auto" />
      </button>
    );
  }

  const isNight = resolvedTheme === "night";

  return (
    <button
      onClick={() => setTheme(isNight ? "doon" : "night")}
      className="relative h-9 w-9 overflow-hidden rounded-lg border border-border transition-colors hover:bg-border/50"
      aria-label="Toggle theme"
    >
      <Sun
        size={16}
        className="absolute inset-0 m-auto transition-all duration-300"
        style={{
          opacity: isNight ? 0 : 1,
          transform: isNight ? "rotate(90deg) scale(0.5)" : "rotate(0deg) scale(1)",
        }}
      />
      <Moon
        size={16}
        className="absolute inset-0 m-auto transition-all duration-300"
        style={{
          opacity: isNight ? 1 : 0,
          transform: isNight ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.5)",
        }}
      />
    </button>
  );
}