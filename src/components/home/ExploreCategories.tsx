import Link from "next/link";
import { Coffee, Trees, UtensilsCrossed, Camera, Landmark, Footprints } from "lucide-react";

const categories = [
  {
    title: "Cafes",
    description: "Cozy cafes and coffee spots across Dehradun.",
    icon: Coffee,
    href: "/places?q=cafes",
    color: "rgb(194 140 74)",       // accent/warm
    bg: "rgb(194 140 74 / 0.1)",
  },
  {
    title: "Nature",
    description: "Forests, rivers, hills and peaceful escapes.",
    icon: Trees,
    href: "/places?q=nature",
    color: "rgb(var(--primary))",
    bg: "rgb(var(--primary) / 0.1)",
  },
  {
    title: "Food",
    description: "Restaurants, street food and local favourites.",
    icon: UtensilsCrossed,
    href: "/places?q=food",
    color: "rgb(220 80 60)",
    bg: "rgb(220 80 60 / 0.1)",
  },
  {
    title: "Photography",
    description: "The most photogenic spots in the city.",
    icon: Camera,
    href: "/places?q=photography",
    color: "rgb(100 120 220)",
    bg: "rgb(100 120 220 / 0.1)",
  },
  {
    title: "Attractions",
    description: "Landmarks and popular tourist destinations.",
    icon: Landmark,
    href: "/places?q=landmark",
    color: "rgb(var(--primary-light))",
    bg: "rgb(var(--primary-light) / 0.1)",
  },
  {
    title: "Walking Spots",
    description: "Perfect places for walks and relaxation.",
    icon: Footprints,
    href: "/places?q=adventure",
    color: "rgb(160 100 200)",
    bg: "rgb(160 100 200 / 0.1)",
  },
];

export default function ExploreCategories() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">

      {/* Header */}
      <div className="mb-12 text-center">
        <p
          className="mb-2 text-sm font-semibold uppercase tracking-widest"
          style={{ color: "rgb(var(--primary))" }}
        >
          Interests
        </p>
        <h2 className="text-3xl font-black md:text-4xl">
          Explore by what you love
        </h2>
        <p
          className="mx-auto mt-3 max-w-md text-sm"
          style={{ color: "rgb(var(--muted))" }}
        >
          Find places and connect with people who share your interests.
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.title}
              href={cat.href}
              className="group flex items-center gap-4 rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                borderColor: "rgb(var(--border))",
                backgroundColor: "rgb(var(--surface))",
              }}
            >
              {/* Icon */}
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                style={{ backgroundColor: cat.bg }}
              >
                <Icon size={22} style={{ color: cat.color }} />
              </div>

              {/* Text */}
              <div>
                <h3 className="font-bold">{cat.title}</h3>
                <p
                  className="mt-0.5 text-xs leading-relaxed"
                  style={{ color: "rgb(var(--muted))" }}
                >
                  {cat.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}