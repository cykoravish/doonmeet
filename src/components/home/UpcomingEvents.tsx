import Link from "next/link";
import { CalendarPlus, MapPin } from "lucide-react";
import type { HomeEvent } from "@/lib/home";
import { buttonClasses } from "@/components/ui/Button";
import SectionHeader from "./SectionHeader";

interface UpcomingEventsProps {
  events: HomeEvent[];
  isLoggedIn: boolean;
}

const TZ = "Asia/Kolkata";

function dateParts(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-IN", { day: "2-digit", timeZone: TZ }),
    month: d.toLocaleDateString("en-IN", { month: "short", timeZone: TZ }),
    full: d.toLocaleString("en-IN", {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone: TZ,
    }),
  };
}

export default function UpcomingEvents({ events, isLoggedIn }: UpcomingEventsProps) {
  return (
    <section aria-labelledby="home-events">
      <SectionHeader id="home-events" title="Coming up in Dehradun" href="/events" />

      {events.length === 0 ? (
        // Empty state that invites action instead of just saying "nothing here".
        <div className="flex items-center gap-4 rounded-[20px] bg-accent-soft p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-surface text-accent-fg">
            <CalendarPlus size={24} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-text">No events yet — host the first one</p>
            <p className="text-sm text-muted">A trek, a chai meetup, a workshop. Doon will show up.</p>
          </div>
          <Link
            href={isLoggedIn ? "/events/create" : "/signup"}
            className={buttonClasses("primary", "sm", "shrink-0")}
          >
            Host
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {events.map((event) => {
            const { day, month, full } = dateParts(event.date);
            return (
              <li key={event._id}>
                <Link
                  href={`/events/${event.slug}`}
                  className="flex items-center gap-3.5 rounded-[20px] border border-border bg-surface p-3.5 transition-colors hover:bg-surface-2"
                >
                  <time
                    dateTime={event.date}
                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[14px] bg-primary-soft text-primary-fg"
                  >
                    <span className="text-xl leading-none font-extrabold">{day}</span>
                    <span className="text-xs font-semibold uppercase">{month}</span>
                  </time>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-text">{event.title}</p>
                    <p className="text-sm text-muted">{full}</p>
                    {event.location?.name && (
                      <p className="flex items-center gap-1 truncate text-sm text-muted">
                        <MapPin size={14} className="shrink-0" aria-hidden="true" />
                        <span className="truncate">{event.location.name}</span>
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
