import Link from "next/link";
import { MapPin, MessageCircle, CalendarDays, Users } from "lucide-react";

const actions = [
  {
    title: "Explore Locations",
    description: "Discover popular places and see who's around you on the live map.",
    icon: MapPin,
    href: "/locations",
    accent: "rgb(var(--primary))",
  },
  {
    title: "Meet People",
    description: "Chat with locals and start meaningful conversations.",
    icon: MessageCircle,
    href: "/chat",
    accent: "rgb(var(--accent))",
  },
  {
    title: "Discover Events",
    description: "Find local meetups, gatherings and activities near you.",
    icon: CalendarDays,
    href: "/events",
    accent: "rgb(var(--primary-light))",
  },
  {
    title: "Join Communities",
    description: "Become part of local groups built around your interests.",
    icon: Users,
    href: "/communities",
    accent: "rgb(var(--primary))",
  },
];

export default function QuickActions() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">

      {/* Section header */}
      <div className="mb-12">
        <p
          className="mb-2 text-sm font-semibold uppercase tracking-widest"
          style={{ color: "rgb(var(--primary))" }}
        >
          Explore
        </p>
        <h2 className="text-3xl font-black md:text-4xl">
          What brings you here?
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="group relative overflow-hidden rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              style={{
                borderColor: "rgb(var(--border))",
                backgroundColor: "rgb(var(--surface))",
              }}
            >
              {/* Accent top bar */}
              <div
                className="absolute left-0 right-0 top-0 h-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{ backgroundColor: action.accent }}
              />

              {/* Icon */}
              <div
                className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${action.accent}18` }}
              >
                <Icon size={20} style={{ color: action.accent }} />
              </div>

              <h3 className="mb-2 font-bold">{action.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgb(var(--muted))" }}>
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}