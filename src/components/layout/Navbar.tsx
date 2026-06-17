"use client";

import Link from "next/link";
import MobileDrawer from "./MobileDrawer";
import DesktopNavLinks from "./DesktopNavLinks";
import ThemeToggle from "../theme/theme-toggle";

export default function Navbar() {
  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-sm"
      style={{
        backgroundColor: "rgb(var(--background) / 0.9)",
        borderColor: "rgb(var(--border))",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
        <h1
          className="mr-12 text-xl font-bold"
          style={{
            color: "rgb(var(--primary))",
          }}
        >
          Doon Meet
        </h1>
        <div className="hidden md:flex items-center gap-8">
          <DesktopNavLinks />
        </div>

        <div className="ml-auto hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="rounded-lg border px-4 py-2">
            Login
          </Link>

          <Link
            href="/signup"
            className="rounded-lg px-4 py-2"
            style={{
              backgroundColor: "rgb(var(--primary))",
              color: "white",
            }}
          >
            Sign Up
          </Link>
        </div>

        <div className="ml-auto md:hidden">
          <MobileDrawer />
        </div>
      </div>
    </header>
  );
}
