"use client";

import { useState } from "react";
import { Menu, X, MapPin, Settings, LogOut, Shield, Bell } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "../theme/theme-toggle";
import { useRouter } from "next/navigation";

interface MobileDrawerProps {
  user: {
    _id: string;
    name: string;
    avatar: string | null;
    isGuest: boolean;
    email?: string;
  } | null;
}

export default function MobileDrawer({ user }: MobileDrawerProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border"
        style={{ borderColor: "rgb(var(--border))" }}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div
            className="fixed right-0 top-0 z-50 flex h-[calc(100vh-64px)] w-72 flex-col border-l"
            style={{
              backgroundColor: "rgb(var(--surface))",
              borderColor: "rgb(var(--border))",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b px-5"
              style={{ borderColor: "rgb(var(--border))" }}
            >
              <Link href="/" className="flex items-center gap-2 group shrink-0 h-16">
                <Image
                  src="/doonmeet-light.png"
                  alt="DoonMeet"
                  width={52}
                  height={52}
                  className="logo-light h-13 w-13 object-contain transition-transform group-hover:scale-105"
                  priority
                />
                <Image
                  src="/doonmeet-dark.png"
                  alt="DoonMeet"
                  width={52}
                  height={52}
                  className="logo-dark h-13 w-13 object-contain transition-transform group-hover:scale-105"
                  priority
                />
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: "rgb(var(--border))" }}
              >
                <X size={15} />
              </button>
            </div>

            {/* User card */}
            {user ? (
              <div
                className="mx-4 mt-4 rounded-2xl p-4"
                style={{
                  background: "linear-gradient(135deg, rgb(var(--primary) / 0.1) 0%, transparent)",
                  border: "1px solid rgb(var(--primary) / 0.15)",
                }}
              >
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={44}
                      height={44}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full font-bold text-white"
                      style={{ backgroundColor: "rgb(var(--primary))" }}
                    >
                      {user.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-bold text-sm">{user.name}</p>
                    {user.email && (
                      <p className="truncate text-xs" style={{ color: "rgb(var(--muted))" }}>
                        {user.email}
                      </p>
                    )}
                    {user.isGuest && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor: "rgb(var(--accent) / 0.15)",
                          color: "rgb(var(--accent))",
                        }}
                      >
                        Guest
                      </span>
                    )}
                  </div>
                </div>

                {!user.isGuest && (
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="mt-3 block w-full rounded-xl py-2 text-center text-xs font-semibold text-white"
                    style={{ backgroundColor: "rgb(var(--primary))" }}
                  >
                    View Profile
                  </Link>
                )}
              </div>
            ) : (
              <div className="mx-4 mt-4 space-y-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-xl border py-2.5 text-center text-sm font-medium"
                  style={{ borderColor: "rgb(var(--border))" }}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white"
                  style={{ backgroundColor: "rgb(var(--primary))" }}
                >
                  Sign up free
                </Link>
              </div>
            )}

            {/* Settings links */}
            <div className="mt-4 flex-1 overflow-y-auto px-4">
              <p
                className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "rgb(var(--muted))" }}
              >
                Account
              </p>
              <div className="space-y-1">
                {user && !user.isGuest && (
                  <>
                    <DrawerLink
                      href="/profile"
                      icon={<Settings size={15} />}
                      label="Settings"
                      onClick={() => setOpen(false)}
                    />
                    <DrawerLink
                      href="/notifications"
                      icon={<Bell size={15} />}
                      label="Notifications"
                      onClick={() => setOpen(false)}
                    />
                  </>
                )}
                <DrawerLink
                  href="/privacy"
                  icon={<Shield size={15} />}
                  label="Privacy Policy"
                  onClick={() => setOpen(false)}
                />
              </div>
            </div>

            {/* Bottom */}
            <div
              className="border-t px-4 py-4 space-y-3"
              style={{ borderColor: "rgb(var(--border))" }}
            >
              {/* Theme toggle */}
              <div
                className="flex items-center justify-between rounded-xl border px-3 py-2.5"
                style={{ borderColor: "rgb(var(--border))" }}
              >
                <span className="text-sm" style={{ color: "rgb(var(--muted))" }}>
                  Theme
                </span>
                <ThemeToggle />
              </div>

              {/* Logout */}
              {user && (
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{
                    borderColor: "rgb(220 38 38 / 0.2)",
                    color: "rgb(220 38 38)",
                  }}
                >
                  <LogOut size={15} />
                  Log out
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function DrawerLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
      style={{ color: "rgb(var(--text))" }}
    >
      <span style={{ color: "rgb(var(--muted))" }}>{icon}</span>
      {label}
    </Link>
  );
}
