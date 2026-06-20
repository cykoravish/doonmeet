"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import ThemeToggle from "../theme/theme-toggle";

export default function MobileDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)} />

          <div
            className="fixed right-0 top-0 z-50 h-screen w-80 border-l p-6"
            style={{
              backgroundColor: "rgb(var(--surface))",
              borderColor: "rgb(var(--border))",
            }}
          >
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: "rgb(var(--primary))" }}>
                Doon Meet
              </h2>

              <button onClick={() => setOpen(false)}>
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>Theme</span>
                <ThemeToggle />
              </div>

              <button className="w-full rounded-lg border p-3 text-left">Login</button>

              <button
                className="w-full rounded-lg p-3 text-left"
                style={{
                  backgroundColor: "rgb(var(--primary))",
                  color: "white",
                }}
              >
                Sign Up
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
