import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, MessageCircle, Users, type LucideIcon } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Community } from "@/models/Community";
import { Place } from "@/models/Place";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";

export const metadata = pageMetadata({
  title: "Explore Dehradun — Events, Communities & Places",
  description:
    "Find upcoming events in Dehradun, join local communities, discover popular places across the Doon Valley and meet people nearby on DoonMeet.",
  path: "/explore",
  keywords: ["things to do in Dehradun", "Dehradun events", "Dehradun communities", "places in Dehradun"],
});

async function getCounts() {
  try {
    await connectDB();
    const [events, communities, places] = await Promise.all([
      Event.countDocuments({ status: "published", date: { $gte: new Date() } }),
      Community.countDocuments({ isActive: true }),
      Place.countDocuments(),
    ]);
    return { events, communities, places };
  } catch {
    return null;
  }
}

interface Section {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  meta?: string;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export default async function ExplorePage() {
  const counts = await getCounts();

  const sections: Section[] = [
    {
      title: "Events",
      description: "Treks, meetups and workshops happening in Dehradun",
      href: "/events",
      icon: CalendarDays,
      meta: counts ? (counts.events > 0 ? `${plural(counts.events, "upcoming event")}` : "Host the first one") : undefined,
    },
    {
      title: "Communities",
      description: "Groups for tech, nature, food, photography and more",
      href: "/communities",
      icon: Users,
      meta: counts
        ? `${counts.communities} ${counts.communities === 1 ? "community" : "communities"}`
        : undefined,
    },
    {
      title: "Places",
      description: "Popular spots across the Doon Valley, rated by locals",
      href: "/places",
      icon: MapPin,
      meta: counts ? plural(counts.places, "place") : undefined,
    },
    {
      title: "People",
      description: "See who's around and start a conversation",
      href: "/chat?members=1",
      icon: MessageCircle,
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6 sm:py-8">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Explore", path: "/explore" }])} />

      <header className="mb-5">
        <h1 className="text-[28px] leading-tight font-extrabold sm:text-4xl">Explore Dehradun</h1>
        <p className="mt-1 text-[15px] text-muted sm:text-base">
          Events, communities, places and people — sab kuch Doon ka, ek jagah.
        </p>
      </header>

      <ul className="flex flex-col gap-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <li key={section.title}>
              <Link
                href={section.href}
                className="flex items-center gap-4 rounded-[20px] border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-primary-soft text-primary-fg">
                  <Icon size={26} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold">{section.title}</h2>
                  <p className="text-sm text-muted">{section.description}</p>
                  {section.meta && (
                    <p className="mt-1 text-sm font-semibold text-primary-fg">{section.meta}</p>
                  )}
                </div>
                <ChevronRight size={20} className="shrink-0 text-muted" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
