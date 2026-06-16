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
  const [isMounted, setIsMounted] = useState(false);

  const openMenu = () => {
    setIsMounted(true);
    window.requestAnimationFrame(() => setIsOpen(true));
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen || !isMounted) return;

    const timeout = window.setTimeout(() => setIsMounted(false), 300);

    return () => window.clearTimeout(timeout);
  }, [isOpen, isMounted]);

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card"
        aria-label="Open Menu"
        aria-expanded={isOpen}
      >
        <Menu size={20} />
      </button>

      {isMounted && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeMenu}
            className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
              isOpen
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          />

          {/* Drawer */}
          <aside
            className={`fixed top-0 right-0 z-50 flex h-screen w-[min(22rem,85vw)] flex-col border-l border-border bg-background transition-transform duration-300 ease-out ${
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
                onClick={closeMenu}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card"
                aria-label="Close Menu"
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
                    onClick={closeMenu}
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
                  onClick={closeMenu}
                  className="block rounded-xl border border-border px-4 py-3 text-center font-medium"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  onClick={closeMenu}
                  className="block rounded-xl bg-primary px-4 py-3 text-center font-semibold text-white"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
