import Link from "next/link";
import Image from "next/image";
import { MapPin, Users } from "lucide-react";

interface EventCardProps {
  slug: string;
  title: string;
  description: string;
  banner: string | null;
  date: string;
  location: { name: string; address: string };
  creator: { name: string; avatar: string | null };
  commentCount: number;
  tags: string[];
}

export default function EventCard({
  slug,
  title,
  description,
  banner,
  date,
  location,
  creator,
  commentCount,
  tags,
}: EventCardProps) {
  const eventDate = new Date(date);
  const day = eventDate.toLocaleDateString("en-IN", { day: "2-digit" });
  const month = eventDate.toLocaleDateString("en-IN", { month: "short" });

  return (
    <Link
      href={`/events/${slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
      style={{
        backgroundColor: "rgb(var(--surface))",
        borderColor: "rgb(var(--border))",
      }}
    >
      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-green-900 to-green-700">
        {banner ? (
          <Image
            src={banner}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          // Fallback pattern when no banner
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: "rgb(var(--primary) / 0.15)" }}
          >
            <span className="text-5xl opacity-30">📍</span>
          </div>
        )}

        {/* Date chip */}
        <div className="absolute left-3 top-3 flex flex-col items-center rounded-xl bg-white px-3 py-1.5 shadow-md">
          <span className="text-xs font-bold uppercase" style={{ color: "rgb(var(--primary))" }}>
            {month}
          </span>
          <span className="text-lg font-black leading-none" style={{ color: "rgb(var(--text))" }}>
            {day}
          </span>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: "rgb(var(--primary) / 0.85)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-1.5 font-bold leading-snug line-clamp-2">{title}</h3>
        <p
          className="mb-4 text-xs leading-relaxed line-clamp-2"
          style={{ color: "rgb(var(--muted))" }}
        >
          {description}
        </p>

        {/* Meta */}
        <div className="mt-auto space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgb(var(--muted))" }}>
            <MapPin size={12} />
            <span className="line-clamp-1">{location.name || location.address || "Dehradun"}</span>
          </div>

          {/* Footer row */}
          <div
            className="flex items-center justify-between pt-2 border-t"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            {/* Creator */}
            <div className="flex items-center gap-1.5">
              {creator.avatar ? (
                <Image
                  src={creator.avatar}
                  alt={creator.name}
                  width={20}
                  height={20}
                  className="rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: "rgb(var(--primary))" }}
                >
                  {creator.name[0]}
                </div>
              )}
              <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                {creator.name}
              </span>
            </div>

            {/* Comment count */}
            <div className="flex items-center gap-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
              <Users size={11} />
              <span>{commentCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
