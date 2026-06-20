import Image from "next/image";
import Link from "next/link";
import { Star, ArrowRight } from "lucide-react";

const places = [
  {
    name: "Clock Tower",
    slug: "clock-tower",
    description: "The iconic landmark in the heart of Dehradun.",
    image: "/images/hero-clock-tower.webp",
    rating: "4.8",
    reviews: "124",
    tag: "Landmark",
  },
  {
    name: "Rajpur Road",
    slug: "rajpur-road",
    description: "Popular cafes, restaurants and hangout spots.",
    image: "/images/places/rajpur-road.webp",
    rating: "4.7",
    reviews: "89",
    tag: "Food & Cafes",
  },
  {
    name: "FRI",
    slug: "fri",
    description: "A historic campus loved by students and photographers.",
    image: "/images/places/fri.webp",
    rating: "4.9",
    reviews: "156",
    tag: "Nature",
  },
  {
    name: "Robber's Cave",
    slug: "robbers-cave",
    description: "One of Dehradun's most visited natural attractions.",
    image: "/images/places/robbers-cave.webp",
    rating: "4.8",
    reviews: "201",
    tag: "Adventure",
  },
];

export default function PopularPlaces() {
  return (
    <section
      className="py-20"
      style={{ backgroundColor: "rgb(var(--surface))" }}
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p
              className="mb-2 text-sm font-semibold uppercase tracking-widest"
              style={{ color: "rgb(var(--primary))" }}
            >
              Discover
            </p>
            <h2 className="text-3xl font-black md:text-4xl">
              Popular in Dehradun
            </h2>
          </div>
          <Link
            href="/locations"
            className="hidden items-center gap-1.5 text-sm font-semibold hover:underline sm:flex"
            style={{ color: "rgb(var(--primary))" }}
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {places.map((place) => (
            <Link
              key={place.name}
              href={`/places/${place.slug}`}
              className="group overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              style={{
                backgroundColor: "rgb(var(--background))",
                borderColor: "rgb(var(--border))",
              }}
            >
              {/* Image */}
              <div className="relative h-52 w-full overflow-hidden">
                <Image
                  src={place.image}
                  alt={place.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Tag badge */}
                <div className="absolute left-3 top-3">
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: "rgb(var(--primary) / 0.85)" }}
                  >
                    {place.tag}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="mb-1 font-bold">{place.name}</h3>
                <p
                  className="mb-3 text-xs leading-relaxed"
                  style={{ color: "rgb(var(--muted))" }}
                >
                  {place.description}
                </p>

                {/* Rating row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star
                      size={13}
                      fill="rgb(var(--accent))"
                      style={{ color: "rgb(var(--accent))" }}
                    />
                    <span className="text-xs font-semibold">{place.rating}</span>
                    <span
                      className="text-xs"
                      style={{ color: "rgb(var(--muted))" }}
                    >
                      ({place.reviews})
                    </span>
                  </div>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "rgb(var(--primary))" }}
                  >
                    Explore →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile view all */}
        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/locations"
            className="flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: "rgb(var(--primary))" }}
          >
            View all places <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}