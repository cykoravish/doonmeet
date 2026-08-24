"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Star, ArrowRight, MapPinOff } from "lucide-react";

interface PlaceCard {
  _id: string;
  title: string;
  slug: string;
  image: string;
  category: string;
  shortDescription: string;
  rating: number | null;
  reviewCount: number;
}

interface PlacesExplorerProps {
  places: PlaceCard[];
}

export default function PlacesExplorer({ places }: PlacesExplorerProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState<string>("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(places.map((p) => p.category)))],
    [places]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places.filter((p) => {
      const matchesCategory = category === "All" || p.category === category;
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [places, query, category]);

  return (
    <>
      <div className="relative mt-8">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: "rgb(var(--muted))" }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places, cafes, landmarks..."
          className="w-full rounded-xl border py-3.5 pl-11 pr-4 text-sm outline-none transition-all focus:ring-2"
          style={{
            backgroundColor: "rgb(var(--surface))",
            borderColor: "rgb(var(--border))",
            color: "rgb(var(--text))",
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((cat) => {
          const active = cat === category;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: active ? "rgb(var(--primary))" : "rgb(var(--primary) / 0.08)",
                color: active ? "white" : "rgb(var(--primary))",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="mt-10">
        <p className="mb-6 text-sm" style={{ color: "rgb(var(--muted))" }}>
          {filtered.length} {filtered.length === 1 ? "place" : "places"} found
        </p>

        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl border py-20 text-center"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            <MapPinOff size={32} style={{ color: "rgb(var(--muted))" }} />
            <p className="mt-3 font-semibold">No places match your search</p>
            <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
              Try a different keyword or category.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((place) => (
              <Link
                key={place.slug}
                href={`/places/${place.slug}`}
                className="group overflow-hidden rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{
                  backgroundColor: "rgb(var(--surface))",
                  borderColor: "rgb(var(--border))",
                }}
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={place.image}
                    alt={place.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span
                    className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: "rgb(var(--primary) / 0.9)" }}
                  >
                    {place.category}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="font-bold">{place.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm" style={{ color: "rgb(var(--muted))" }}>
                    {place.shortDescription}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm font-medium">
                      <Star size={14} fill="currentColor" style={{ color: "rgb(var(--accent))" }} />
                      {place.rating ? (
                        <>
                          {place.rating}{" "}
                          <span style={{ color: "rgb(var(--muted))" }}>({place.reviewCount})</span>
                        </>
                      ) : (
                        <span style={{ color: "rgb(var(--muted))" }}>No reviews yet</span>
                      )}
                    </span>
                    <span
                      className="flex items-center gap-1 text-sm font-semibold"
                      style={{ color: "rgb(var(--primary))" }}
                    >
                      Explore <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}