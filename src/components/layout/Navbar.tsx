import Link from "next/link";
import Image from "next/image";
import NavLinks from "./NavLinks";
import ThemeToggle from "../theme/theme-toggle";
import MobileDrawer from "./MobileDrawer";
import NotificationBell from "./NotificationBell";
import type { NavUser } from "@/types/user";
import Logo from "./get-logo/Logo";
import { NotificationsProvider } from "@/providers/notifications-provider";

interface NavbarProps {
  user: NavUser | null;
}

export default function Navbar({ user }: NavbarProps) {
  const notifUserId = user ? user._id : null;

  return (
    <NotificationsProvider userId={notifUserId}>
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-6">
          {/* Logo */}
          <Logo />

          {/* Desktop nav links */}
          <div className="hidden md:flex flex-1 items-center">
            <NavLinks />
          </div>

          {/* Desktop right actions */}
          <div className="ml-auto hidden md:flex items-center gap-2">
            <ThemeToggle />

            {user ? (
              <>
                <NotificationBell />

                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-xl border border-border px-2 py-1.5 transition-opacity hover:opacity-80"
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
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      {user.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium max-w-[100px] truncate">
                    {user.name.split(" ")[0]}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-text transition-colors hover:opacity-80"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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
    </NotificationsProvider>
  );
}