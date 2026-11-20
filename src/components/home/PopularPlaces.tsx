import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { PlaceWithRating } from "@/lib/places";
import SectionHeader from "./SectionHeader";

interface PopularPlacesProps {
  places: PlaceWithRating[];
}

// Real places + real ratings from the database (no hardcoded numbers).
// Mobile: a horizontal row where the next card peeks in, so it's obvious
// you can swipe. Desktop: a plain grid.
export default function PopularPlaces({ places }: PopularPlacesProps) {
  if (places.length === 0) return null;

  return (
    <section aria-labelledby="home-places">
      <SectionHeader id="home-places" title="Popular in Dehradun" href="/places" />

      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
        {places.map((place) => (
          <li key={place._id} className="w-[72%] shrink-0 snap-start sm:w-auto">
            <Link
              href={`/places/${place.slug}`}
              className="block overflow-hidden rounded-[20px] border border-border bg-surface transition-colors hover:bg-surface-2"
            >
              <div className="relative aspect-[4/3] w-full bg-surface-2">
                <Image
                  src={place.image}
                  alt={place.title}
                  fill
                  sizes="(max-width: 640px) 72vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
                <span className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
                  {place.category}
                </span>
              </div>
              <div className="p-3.5">
                <h3 className="truncate text-base font-bold">{place.title}</h3>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted">{place.shortDescription}</p>
                <p className="mt-2 flex items-center gap-1 text-sm">
                  {place.rating !== null ? (
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
    </section>
  );
}
