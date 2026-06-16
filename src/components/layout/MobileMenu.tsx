"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Map", href: "/map" },
  { label: "Chat", href: "/chat" },
  { label: "Events", href: "/events" },
  { label: "Communities", href: "/communities" },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card"
        aria-label="Open Menu"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 flex h-screen w-[85%] max-w-sm flex-col border-l border-border bg-background transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="text-xl font-bold">
            Doon<span className="text-primary">Meet</span>
          </span>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links */}
        <div className="flex flex-1 flex-col p-5">
          <nav className="space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block rounded-xl px-4 py-3 text-base font-medium transition-colors hover:bg-card"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Bottom Auth */}
          <div className="mt-auto space-y-3 border-t border-border pt-5">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="block rounded-xl border border-border px-4 py-3 text-center font-medium"
            >
              Login
            </Link>

            <Link
              href="/signup"
              onClick={() => setIsOpen(false)}
              className="block rounded-xl bg-primary px-4 py-3 text-center font-semibold text-white"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}