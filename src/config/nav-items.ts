import {
  CalendarDays,
  Compass,
  House,
  MapPin,
  MessageCircle,
  Newspaper,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Extra path prefixes that should also mark this item active. */
  matches?: string[];
}

// Desktop top bar — enough room to show every section directly.
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: House },
  { label: "Posts", href: "/posts", icon: Newspaper },
  { label: "Chat", href: "/chat", icon: MessageCircle },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Communities", href: "/communities", icon: Users },
  { label: "Places", href: "/places", icon: MapPin },
];

// Mobile bottom bar — two items, the centre Create button, two items.
// Events / Communities / Places live under Explore to keep tap targets big.
export const MOBILE_NAV_LEFT: NavItem[] = [
  { label: "Home", href: "/", icon: House },
  { label: "Posts", href: "/posts", icon: Newspaper },
];

export const MOBILE_NAV_RIGHT: NavItem[] = [
  { label: "Chat", href: "/chat", icon: MessageCircle },
  {
    label: "Explore",
    href: "/explore",
    icon: Compass,
    matches: ["/events", "/communities", "/places"],
  },
];

function matchesPath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavItemActive(pathname: string, item: NavItem | string): boolean {
  if (typeof item === "string") return matchesPath(pathname, item);
  return (
    matchesPath(pathname, item.href) ||
    (item.matches ?? []).some((prefix) => matchesPath(pathname, prefix))
  );
}
