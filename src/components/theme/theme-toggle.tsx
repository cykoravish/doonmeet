"use client";

import { useTheme } from "@/providers/theme-provider";
import { useEffect, useState } from "react";
import { Moon, Trees } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="rounded-lg border p-2">
        <Moon size={18} />
      </button>
    );
  }

  return (
    <button onClick={toggleTheme} className="rounded-lg border p-2" aria-label="Toggle Theme">
      {theme === "doon" ? <Moon size={18} /> : <Trees size={18} />}
    </button>
  );
}
