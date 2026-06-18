import Link from "next/link";
import Image from "next/image";

const places = [
  {
    name: "Clock Tower",
    href: "/places/clock-tower",
    image: "/images/hero-clock-tower.webp",
  },
  {
    name: "Rajpur Road",
    href: "/places/rajpur-road",
    image: "/images/places/rajpur-road.webp",
  },
  {
    name: "Forest Research Institute",
    href: "/places/fri",
    image: "/images/places/fri.webp",
  },
  {
    name: "Robber's Cave",
    href: "/places/robbers-cave",
    image: "/images/places/robbers-cave.webp",
  },
  {
    name: "Sahastradhara",
    href: "#",
    image: "/images/hero-clock-tower.webp",
  },
  {
    name: "Tapkeshwar Temple",
    href: "#",
    image: "/images/hero-clock-tower.webp",
  },
];

export default function PlacesPage() {
  return (
    <div>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">Explore Places in Dehradun</h1>

        <p
          className="max-w-2xl"
          style={{
            color: "rgb(var(--muted))",
          }}
        >
          Discover landmarks, attractions, cafes, nature spots and local experiences across
          Dehradun.
        </p>

        <input
          type="text"
          placeholder="Search places..."
          className="mt-8 w-full rounded-xl border p-4"
        />
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-10">
          <h2 className="mb-2 text-3xl font-bold">Popular Places</h2>

          <p
            style={{
              color: "rgb(var(--muted))",
            }}
          >
            Explore the most visited and loved places across Dehradun.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <Link
              key={place.name}
              href={place.href}
              className="overflow-hidden rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-56">
                <Image src={place.image} alt={place.name} fill className="object-cover" />
              </div>

              <div className="p-5">
                <h2 className="text-xl font-semibold">{place.name}</h2>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
