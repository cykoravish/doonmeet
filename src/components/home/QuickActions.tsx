import Link from "next/link";
import { CalendarDays, MapPin, PenLine, Users, type LucideIcon } from "lucide-react";

interface Action {
  label: string;
  href: string;
  icon: LucideIcon;
}

// Shortcuts for logged-in users — one tap to the most common things.
const ACTIONS: Action[] = [
  { label: "Post", href: "/posts?compose=1", icon: PenLine },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "People", href: "/chat?members=1", icon: Users },
  { label: "Places", href: "/places", icon: MapPin },
];

export default function QuickActions() {
  return (
    <nav aria-label="Quick actions">
      <ul className="grid grid-cols-4 gap-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.label}>
              <Link
                href={action.href}
                className="flex flex-col items-center gap-1.5 rounded-[18px] border border-border bg-surface px-1 py-3 text-[13px] font-semibold text-text transition-colors hover:bg-surface-2"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary-soft text-primary-fg">
                  <Icon size={20} aria-hidden="true" />
                </span>
                {action.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
