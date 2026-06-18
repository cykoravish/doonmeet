import Image from "next/image";
import Link from "next/link";

const places = [
  {
    name: "Clock Tower",
    href: "/locations/clock-tower",
    description: "The iconic landmark in the heart of Dehradun.",
    image: "/images/hero-clock-tower.webp",
    rating: "4.8",
    reviews: "124",
  },
  {
    name: "Rajpur Road",
    href: "/locations/rajpur-road",
    description: "Popular cafes, restaurants and hangout spots.",
    image: "/images/places/rajpur-road.webp",
    rating: "4.7",
    reviews: "89",
  },
  {
    name: "FRI",
    href: "/locations/fri",
    description: "A historic campus loved by students and photographers.",
    image: "/images/places/fri.webp",
    rating: "4.9",
    reviews: "156",
  },
  {
    name: "Robber's Cave",
    href: "/locations/robbers-cave",
    description: "One of Dehradun's most visited natural attractions.",
    image: "/images/places/robbers-cave.webp",
    rating: "4.8",
    reviews: "201",
  },
];

export default function PopularPlaces() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12">
        <h2 className="mb-3 text-3xl font-bold">Popular Places in Dehradun</h2>

        <p
          style={{
            color: "rgb(var(--muted))",
          }}
        >
          Discover popular places, read reviews and explore local experiences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {places.map((place) => (
          <Link
            key={place.name}
            href={place.href}
            className="overflow-hidden rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl"
            style={{
              backgroundColor: "rgb(var(--surface))",
              borderColor: "rgb(var(--border))",
            }}
          >
            <div className="relative h-48 w-full">
              <Image src={place.image} alt={place.name} fill className="object-cover" />
            </div>

            <div className="p-5">
              <h3 className="mb-2 text-xl font-semibold">{place.name}</h3>

              <p
                className="mb-4 text-sm"
                style={{
                  color: "rgb(var(--muted))",
                }}
              >
                {place.description}
              </p>
              <div
                className="mb-4 flex items-center gap-3 text-sm"
                style={{
                  color: "rgb(var(--muted))",
                }}
              >
                <span>⭐ {place.rating}</span>
                <span>💬 {place.reviews}</span>
              </div>
              <span
                className="text-sm font-medium"
                style={{
                  color: "rgb(var(--primary))",
                }}
              >
                View Details →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
