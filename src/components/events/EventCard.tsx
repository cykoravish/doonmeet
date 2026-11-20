import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { eventDay, eventMonth, eventShortDate, eventTime } from "@/lib/dates";

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

export default function EventCard({ slug, title, banner, date, location, creator, tags }: EventCardProps) {
  const place = location?.name || location?.address || "Dehradun";

  return (
    <Link
      href={`/events/${slug}`}
      className="flex flex-col overflow-hidden rounded-[20px] border border-border bg-surface transition-colors hover:bg-surface-2"
    >
      <div className="relative aspect-[16/9] w-full bg-primary-soft">
        {banner ? (
          <Image
            src={banner}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-primary-fg" aria-hidden="true">
            <CalendarDays size={40} strokeWidth={1.5} />
          </span>
        )}

        {/* Date tile — readable at a glance, the thing people scan for */}
        <span className="absolute top-3 left-3 flex h-14 w-12 flex-col items-center justify-center rounded-[12px] bg-surface text-text shadow-sm">
          <span className="text-[11px] font-bold text-primary-fg uppercase">{eventMonth(date)}</span>
          <span className="text-xl leading-none font-extrabold">{eventDay(date)}</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {tags.length > 0 && (
          <p className="mb-1 text-xs font-bold tracking-wide text-primary-fg uppercase">{tags.slice(0, 2).join(" · ")}</p>
        )}
        <h2 className="line-clamp-2 text-[17px] leading-snug font-bold text-text">{title}</h2>

        <ul className="mt-2 flex flex-col gap-1 text-sm text-muted">
          <li className="flex items-center gap-1.5">
            <Clock size={15} className="shrink-0" aria-hidden="true" />
            <time dateTime={new Date(date).toISOString()}>
              {eventShortDate(date)} · {eventTime(date)}
            </time>
          </li>
          <li className="flex items-center gap-1.5">
            <MapPin size={15} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{place}</span>
          </li>
        </ul>

        {creator?.name && <p className="mt-auto pt-3 text-[13px] text-muted">Hosted by {creator.name}</p>}
      </div>
    </Link>
  );
}
