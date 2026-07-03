import { House, MapPinned, MessageCircle, Users, CalendarDays, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: House },
  { label: "Map", href: "/locations", icon: MapPinned },
  { label: "Chat", href: "/chat", icon: MessageCircle },
  { label: "Communities", href: "/communities", icon: Users },
  { label: "Events", href: "/events", icon: CalendarDays },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}