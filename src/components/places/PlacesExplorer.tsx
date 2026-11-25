"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Star, MapPinOff } from "lucide-react";
import { badgeClasses } from "@/components/ui/Badge";
import PhotoCreditBadge from "./PhotoCreditBadge";

interface PlaceCard {
  _id: string;
  title: string;
  slug: string;
  image: string;
  category: string;
  shortDescription: string;
  rating: number | null;
  reviewCount: number;
  imageCredit?: { author: string; license: string } | null;
}

interface PlacesExplorerProps {
  places: PlaceCard[];
}

export default function PlacesExplorer({ places }: PlacesExplorerProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState<string>("All");

  const categories = useMemo(() => ["All", ...Array.from(new Set(places.map((p) => p.category)))], [places]);

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
      <div className="flex h-12 items-center gap-2 rounded-[14px] border-[1.5px] border-transparent bg-surface-2 px-3.5 focus-within:border-primary focus-within:bg-surface">
        <Search size={18} className="shrink-0 text-muted" aria-hidden="true" />
        <label htmlFor="places-search" className="sr-only">
          Search places
        </label>
        <input
          id="places-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places, cafes, landmarks…"
          className="w-full bg-transparent text-base text-text outline-none placeholder:text-muted"
        />
      </div>

      {categories.length > 2 && (
        <div className="-mx-4 mt-3 sm:mx-0" role="group" aria-label="Filter by category">
          <div className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
            {categories.map((cat) => {
              const active = cat === category;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  aria-pressed={active}
                  className={`${badgeClasses(active ? "solid" : "neutral", "md")} transition-colors ${
                    active ? "" : "hover:bg-border"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-4 mb-3 text-sm text-muted" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "place" : "places"}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-border py-16 text-center">
          <MapPinOff size={30} className="text-muted" aria-hidden="true" />
          <p className="mt-3 font-semibold">No places match your search</p>
          <p className="mt-1 text-[15px] text-muted">Try a different word or category.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {filtered.map((place, i) => (
            <li key={place.slug}>
              <Link
                href={`/places/${place.slug}`}
                className="block overflow-hidden rounded-[20px] border border-border bg-surface transition-colors hover:bg-surface-2"
              >
                <div className="relative aspect-[16/10] bg-surface-2">
                  <Image
                    src={place.image}
                    alt={place.title}
                    fill
                    // First card is above the fold on phones — load it eagerly.
                    priority={i === 0}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
                    {place.category}
                  </span>
                  <PhotoCreditBadge credit={place.imageCredit} />
                </div>

                <div className="p-4">
                  <h2 className="text-[17px] font-bold text-text">{place.title}</h2>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted">{place.shortDescription}</p>
                  <p className="mt-2 flex items-center gap-1 text-sm">
                    {place.rating ? (
                      <>
                        <Star size={15} className="fill-accent text-accent" aria-hidden="true" />
                        <span className="font-semibold">{place.rating}</span>
                        <span className="text-muted">
                          ({place.reviewCount} {place.reviewCount === 1 ? "review" : "reviews"})
                        </span>
                      </>
                    ) : (
                      <span className="font-semibold text-primary-fg">Be the first to review</span>
                    )}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
