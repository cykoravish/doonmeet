import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { MapPin, Clock, Navigation2, Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getPlaceWithRating } from "@/lib/places";
import { getSessionUser } from "@/lib/getSessionUser";
import PlaceReviews from "@/components/places/PlaceReviews";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlaceWithRating(slug);

  if (!place) return { title: "Place Not Found | DoonMeet" };

  return {
    title: `${place.title} — Dehradun | DoonMeet`,
    description: place.shortDescription,
    alternates: { canonical: `https://doonmeet.in/places/${slug}` },
    openGraph: {
      title: `${place.title} | DoonMeet`,
      description: place.shortDescription,
      images: [place.image as string],
      url: `https://doonmeet.in/places/${slug}`,
    },
  };
}

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [place, currentUser] = await Promise.all([
    getPlaceWithRating(slug),
    getSessionUser(),
  ]);

  if (!place) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: place.title as string,
    description: place.shortDescription as string,
    image: `https://doonmeet.in${place.image}`,
    url: `https://doonmeet.in/places/${slug}`,
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

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="relative h-72 w-full md:h-96">
        <Image
          src={place.image as string}
          alt={place.title as string}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgb(0 0 0 / 0.75), rgb(0 0 0 / 0.15) 50%, transparent)",
          }}
        />
        <Link
          href="/places"
          className="absolute left-6 top-6 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
          style={{ backgroundColor: "rgb(0 0 0 / 0.35)" }}
        >
          <ArrowLeft size={14} /> Back to Places
        </Link>

        <div className="absolute bottom-6 left-6 right-6">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: "rgb(var(--primary) / 0.9)" }}
          >
            {place.category as string}
          </span>
          <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">
            {place.title as string}
          </h1>
          {place.rating ? (
            <div className="mt-2 flex items-center gap-1.5 text-white">
              <Star size={16} fill="currentColor" style={{ color: "rgb(var(--accent))" }} />
              <span className="font-semibold">{place.rating as number}</span>
              <span className="text-sm text-white/80">({place.reviewCount as number} reviews)</span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-white/80">No reviews yet</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2">
          <p
            className="mb-2 text-sm font-semibold uppercase tracking-widest"
            style={{ color: "rgb(var(--primary))" }}
          >
            About
          </p>
          <div className="space-y-4 leading-relaxed" style={{ color: "rgb(var(--text))" }}>
            {(place.about as string).split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Highlights */}
          {(place.highlights as string[])?.length > 0 && (
            <div className="mt-8">
              <p
                className="mb-3 text-sm font-semibold uppercase tracking-widest"
                style={{ color: "rgb(var(--primary))" }}
              >
                Highlights
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(place.highlights as string[]).map((h, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl border p-3.5 text-sm"
                    style={{ borderColor: "rgb(var(--border))" }}
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: "rgb(var(--primary))" }}
                    >
                      ✓
                    </span>
                    {h}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="mt-10">
            <p
              className="mb-4 text-sm font-semibold uppercase tracking-widest"
              style={{ color: "rgb(var(--primary))" }}
            >
              Reviews
            </p>
            <PlaceReviews
              slug={slug}
              currentUser={currentUser}
              initialRating={place.rating as number | null}
              initialReviewCount={place.reviewCount as number}
            />
          </div>
        </div>

        {/* Sidebar — Quick Facts */}
        <div>
          <div
            className="sticky top-24 rounded-2xl border p-6"
            style={{
              backgroundColor: "rgb(var(--surface))",
              borderColor: "rgb(var(--border))",
            }}
          >
            <p className="font-bold">Quick Facts</p>
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0" style={{ color: "rgb(var(--primary))" }} />
                <div>
                  <p className="font-medium">How to reach</p>
                  <p style={{ color: "rgb(var(--muted))" }}>{place.howToReach as string}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={16} className="mt-0.5 shrink-0" style={{ color: "rgb(var(--primary))" }} />
                <div>
                  <p className="font-medium">Best time to visit</p>
                  <p style={{ color: "rgb(var(--muted))" }}>{place.bestTimeToVisit as string}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Navigation2 size={16} className="mt-0.5 shrink-0" style={{ color: "rgb(var(--primary))" }} />
                <div>
                  <p className="font-medium">Category</p>
                  <p style={{ color: "rgb(var(--muted))" }}>{place.category as string}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}