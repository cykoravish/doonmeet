import Link from "next/link";
import Image from "next/image";
import { Users } from "lucide-react";

const CATEGORY_ICONS: Record<string, string> = {
  tech:         "💻",
  nature:       "🌿",
  food:         "🍜",
  photography:  "📸",
  sports:       "⚽",
  arts:         "🎨",
  general:      "🏙️",
};

const CATEGORY_COLORS: Record<string, string> = {
  tech:         "rgb(100 120 220)",
  nature:       "rgb(var(--primary))",
  food:         "rgb(220 80 60)",
  photography:  "rgb(160 100 200)",
  sports:       "rgb(var(--accent))",
  arts:         "rgb(220 120 60)",
  general:      "rgb(var(--primary-light))",
};

interface CommunityCardProps {
  name: string;
  slug: string;
  description: string;
  banner: string | null;
  icon: string | null;
  category: string;
  memberCount: number;
}

export default function CommunityCard({
  name,
  slug,
  description,
  banner,
  icon,
  category,
  memberCount,
}: CommunityCardProps) {
  const color = CATEGORY_COLORS[category] ?? "rgb(var(--primary))";
  const emoji = CATEGORY_ICONS[category] ?? "🏙️";

  return (
    <Link
      href={`/communities/${slug}`}
      className="reveal-on-scroll group flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
      style={{
        backgroundColor: "rgb(var(--surface))",
        borderColor: "rgb(var(--border))",
      }}
    >
      {/* Banner / colored header */}
      <div className="relative h-20 w-full overflow-hidden sm:h-24">
        {banner ? (
          <Image
            src={banner}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${color}30 0%, ${color}10 100%)`,
              borderBottom: `2px solid ${color}20`,
            }}
          />
        )}

        {/* Category badge */}
        <div className="absolute right-3 top-3">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize sm:text-xs"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {category}
          </span>
        </div>
      </div>

      {/* Icon — overlaps banner */}
      <div className="relative px-4 pb-4 sm:px-5">
        <div
          className="-mt-5 mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border-2 text-lg shadow-sm sm:h-12 sm:w-12 sm:text-xl"
          style={{
            backgroundColor: "rgb(var(--surface))",
            borderColor: "rgb(var(--border))",
          }}
        >
          {icon ? (
            <Image src={icon} alt={name} width={28} height={28} className="rounded-lg" />
          ) : (
            <span>{emoji}</span>
          )}
        </div>

        <h3 className="mb-1.5 text-[13px] font-bold leading-snug sm:text-base">{name}</h3>
        <p
          className="mb-4 text-[11px] leading-relaxed line-clamp-2 sm:text-xs"
          style={{ color: "rgb(var(--muted))" }}
        >
          {description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-1.5 text-[11px] sm:text-xs"
            style={{ color: "rgb(var(--muted))" }}
          >
            <Users size={12} />
            <span>{memberCount.toLocaleString()} members</span>
          </div>
          <span
            className="text-[11px] font-semibold sm:text-xs"
            style={{ color }}
          >
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}