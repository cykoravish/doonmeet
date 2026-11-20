import Link from "next/link";
import { badgeClasses } from "@/components/ui/Badge";

interface FilterChipsProps {
  label: string;
  items: { label: string; href: string; active: boolean }[];
}

// Server-rendered filter row (real links, so filtered pages are crawlable
// and work without JS). Scrolls sideways on phones — the edge padding makes
// the next chip peek in so it's obvious there's more.
export default function FilterChips({ label, items }: FilterChipsProps) {
  return (
    <nav aria-label={label} className="-mx-4 mb-4 sm:mx-0 sm:mb-6">
      <ul className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              scroll={false}
              aria-current={item.active ? "page" : undefined}
              className={`${badgeClasses(item.active ? "solid" : "neutral", "md")} transition-colors ${
                item.active ? "" : "hover:bg-border"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
