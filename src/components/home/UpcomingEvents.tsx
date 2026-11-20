import Link from "next/link";
import { CalendarPlus, MapPin } from "lucide-react";
import type { HomeEvent } from "@/lib/home";
import { eventDay, eventMonth, eventTime, eventWeekday } from "@/lib/dates";
import { buttonClasses } from "@/components/ui/Button";
import SectionHeader from "./SectionHeader";

interface UpcomingEventsProps {
  events: HomeEvent[];
  isLoggedIn: boolean;
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
            // Always IST (see src/lib/dates.ts) — the server may run in UTC.
            const day = eventDay(event.date);
            const month = eventMonth(event.date);
            const when = `${eventWeekday(event.date)} · ${eventTime(event.date)}`;
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
                    <p className="text-sm text-muted">{when}</p>
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
