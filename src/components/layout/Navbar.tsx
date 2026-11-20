import Link from "next/link";
import NavLinks from "./NavLinks";
import ThemeToggle from "../theme/theme-toggle";
import MobileDrawer from "./MobileDrawer";
import NotificationBell, { NotificationLink } from "./NotificationBell";
import type { NavUser } from "@/types/user";
import Logo from "./get-logo/Logo";
import Avatar from "@/components/ui/Avatar";
import { buttonClasses } from "@/components/ui/Button";
import { NotificationsProvider } from "@/providers/notifications-provider";

interface NavbarProps {
  user: NavUser | null;
}

export default function Navbar({ user }: NavbarProps) {
  const notifUserId = user ? user._id : null;

  return (
    <NotificationsProvider userId={notifUserId}>
      {/* Solid background, no backdrop-blur: a blurred sticky bar repaints on
          every scroll frame, which stutters on low-end phones. */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6 md:h-16">
          <Logo />

          {/* Desktop nav */}
          <div className="hidden flex-1 items-center md:flex">
            <NavLinks />
          </div>

          {/* Desktop actions */}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <ThemeToggle />
            {user ? (
              <>
                <NotificationBell />
                <Link
                  href="/profile"
                  className="flex h-11 items-center gap-2 rounded-[14px] pr-3 pl-1.5 transition-colors hover:bg-surface-2"
                >
                  <Avatar name={user.name} src={user.avatar} size={32} />
                  <span className="max-w-[110px] truncate text-[15px] font-semibold">
                    {user.name.split(" ")[0]}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className={buttonClasses("ghost", "sm", "text-text")}>
                  Log in
                </Link>
                <Link href="/signup" className={buttonClasses("primary", "sm")}>
                  Sign up free
                </Link>
              </>
            )}
          </div>

          {/* Mobile actions — theme toggle lives inside the menu to keep this row uncluttered */}
          <div className="ml-auto flex items-center gap-2 md:hidden">
            {user ? (
              <NotificationLink />
            ) : (
              <Link href="/signup" className={buttonClasses("primary", "sm")}>
                Sign up
              </Link>
            )}
            <MobileDrawer user={user} />
          </div>
        </div>
      </header>
    </NotificationsProvider>
  );
}
