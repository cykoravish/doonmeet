import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { CircleCheck, Clock, ExternalLink, MapPin, Star, Tag } from "lucide-react";
import { getPlaceWithRating } from "@/lib/places";
import { getSessionUser } from "@/lib/getSessionUser";
import { mapsSearchUrl } from "@/lib/dates";
import PlaceReviews from "@/components/places/PlaceReviews";
import BackLink from "@/components/shared/BackLink";
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, truncate } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlaceWithRating(slug);

  if (!place) return { title: "Place Not Found", robots: { index: false, follow: false } };

  return pageMetadata({
    title: `${place.title as string}, Dehradun — Guide & Reviews`,
    description: truncate(place.shortDescription as string),
    path: `/places/${slug}`,
    image: place.image as string,
  });
}

export default async function PlaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [place, currentUser] = await Promise.all([getPlaceWithRating(slug), getSessionUser()]);

  if (!place) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: place.title,
    description: place.shortDescription,
    image: absoluteUrl(place.image),
    url: absoluteUrl(`/places/${slug}`),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dehradun",
      addressRegion: "Uttarakhand",
      addressCountry: "IN",
    },
    ...(place.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: place.rating,
        reviewCount: place.reviewCount,
      },
    }),
  };

  const facts = [
    { icon: MapPin, label: "How to reach", value: place.howToReach },
    { icon: Clock, label: "Best time to visit", value: place.bestTimeToVisit },
    { icon: Tag, label: "Category", value: place.category },
  ].filter((f) => f.value);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-3 pb-8 sm:px-6 sm:pt-6">
      <JsonLd
        data={[
          jsonLd,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Places", path: "/places" },
            { name: place.title, path: `/places/${slug}` },
          ]),
        ]}
      />

      <BackLink href="/places" label="All places" />

      <div className="relative aspect-[16/10] max-h-[440px] w-full overflow-hidden rounded-[20px] bg-surface-2 sm:aspect-[16/9]">
        <Image
          src={place.image}
          alt={place.title}
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          priority
          className="object-cover"
        />
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
        <header className="lg:col-start-1">
          <p className="text-xs font-bold tracking-wide text-primary-fg uppercase">{place.category}</p>
          <h1 className="mt-0.5 text-[28px] leading-tight font-extrabold sm:text-4xl">{place.title}</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-[15px]">
            {place.rating ? (
              <>
                <Star size={17} className="fill-accent text-accent" aria-hidden="true" />
                <span className="font-bold">{place.rating}</span>
                <span className="text-muted">
                  · {place.reviewCount} {place.reviewCount === 1 ? "review" : "reviews"}
                </span>
              </>
            ) : (
              <span className="text-muted">No reviews yet</span>
            )}
          </p>
        </header>

        {/* Quick facts — right after the title on phones, sticky sidebar on desktop */}
        <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="flex flex-col gap-3 lg:sticky lg:top-24">
            <div className="rounded-[20px] border border-border bg-surface p-4">
              <h2 className="mb-3 text-lg font-extrabold">Quick facts</h2>
              <ul className="flex flex-col gap-3.5">
                {facts.map(({ icon: Icon, label, value }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary-soft text-primary-fg">
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] text-muted">{label}</span>
                      <span className="block text-[15px] font-semibold text-text">{value}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <a
              href={mapsSearchUrl(place.title)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-surface-2 text-[15px] font-semibold text-text transition-colors hover:bg-border"
            >
              <MapPin size={18} aria-hidden="true" />
              Open in Google Maps
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-7 lg:col-start-1">
          <section aria-labelledby="place-about-title">
            <h2 id="place-about-title" className="mb-2 text-xl font-extrabold">
              About
            </h2>
            <div className="flex flex-col gap-3 text-[16px] leading-relaxed text-text">
              {place.about.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          {place.highlights?.length > 0 && (
            <section aria-labelledby="place-highlights-title">
              <h2 id="place-highlights-title" className="mb-3 text-xl font-extrabold">
                Highlights
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {place.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5 rounded-[16px] bg-surface-2 p-3.5 text-[15px]">
                    <CircleCheck size={19} className="mt-0.5 shrink-0 text-primary-fg" aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="place-reviews-title">
            <h2 id="place-reviews-title" className="mb-3 text-xl font-extrabold">
              Reviews
            </h2>
            <PlaceReviews
              slug={slug}
              currentUser={currentUser}
              initialRating={place.rating}
              initialReviewCount={place.reviewCount}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
