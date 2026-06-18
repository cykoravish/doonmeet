import Link from "next/link";

const actions = [
  {
    title: "Explore Dehradun",
    description: "Discover popular places and activity across the city.",
    icon: "🗺️",
    href: "/locations",
  },
  {
    title: "Meet People",
    description: "Connect with people and start meaningful conversations.",
    icon: "👥",
    href: "/chat",
  },
  {
    title: "Discover Events",
    description: "Find local meetups, gatherings and activities.",
    icon: "🎉",
    href: "/events",
  },
  {
    title: "Join Communities",
    description: "Become part of local groups and discussions.",
    icon: "💬",
    href: "/communities",
  },
];

export default function QuickActions() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 text-center">
        <h2 className="mb-3 text-3xl font-bold">
          What are you looking for today?
        </h2>

        <p
          style={{
            color: "rgb(var(--muted))",
          }}
        >
          Explore Dehradun, connect with people, discover events and communities.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
            style={{
              borderColor: "rgb(var(--border))",
              backgroundColor: "rgb(var(--surface))",
            }}
          >
            <div className="mb-4 text-3xl">{action.icon}</div>

            <h3 className="mb-2 text-lg font-semibold">
              {action.title}
            </h3>

            <p
              className="text-sm"
              style={{
                color: "rgb(var(--muted))",
              }}
            >
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}