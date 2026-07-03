import Link from "next/link";
import Image from "next/image";
import NavLinks from "./NavLinks";
import ThemeToggle from "../theme/theme-toggle";
import MobileDrawer from "./MobileDrawer";
import NotificationBell from "./NotificationBell";
import { MapPin } from "lucide-react";

interface NavbarProps {
  user: {
    _id: string;
    name: string;
    avatar: string | null;
    isGuest: boolean;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{
        backgroundColor: "rgb(var(--background) / 0.9)",
        borderColor: "rgb(var(--border))",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
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

        {/* Desktop nav links */}
        <div className="hidden md:flex flex-1 items-center">
          <NavLinks />
        </div>

        {/* Desktop right actions */}
        <div className="ml-auto hidden md:flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <>
              {/* Notification bell */}
              {!user.isGuest && <NotificationBell userId={user._id} />}

              {/* Profile avatar */}
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-opacity hover:opacity-80"
                style={{ borderColor: "rgb(var(--border))" }}
              >
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={28}
                    height={28}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: "rgb(var(--primary))" }}
                  >
                    {user.name[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium max-w-[100px] truncate">
                  {user.isGuest ? "Guest" : user.name.split(" ")[0]}
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: "rgb(var(--text))" }}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "rgb(var(--primary))" }}
              >
                Sign up free
              </Link>
            </>
          )}
        </div>

        {/* Mobile right */}
        <div className="ml-auto flex md:hidden items-center gap-2">
          <ThemeToggle />
          <MobileDrawer user={user} />
        </div>
      </div>
    </header>
  );
}
