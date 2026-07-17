import Image from "next/image";
import type { Metadata } from "next";

const locations = {
  "clock-tower": {
    title: "Clock Tower",
    image: "/images/hero-clock-tower.webp",
    description:
      "The Clock Tower is one of the most iconic landmarks of Dehradun and serves as a popular meeting point for locals and visitors.",
    rating: "4.8",
    reviews: "124",
    category: "Dehradun Landmark",
  },

  "rajpur-road": {
    title: "Rajpur Road",
    image: "/images/places/rajpur-road.webp",
    description:
      "Rajpur Road is one of Dehradun's most popular streets, known for cafes, restaurants and shopping destinations.",
    rating: "4.7",
    reviews: "89",
    category: "Popular Area",
  },

  fri: {
    title: "Forest Research Institute",
    image: "/images/places/fri.webp",
    description:
      "FRI is one of the most beautiful campuses in India and a favorite place for photography and walks.",
    rating: "4.9",
    reviews: "156",
    category: "Historic Campus",
  },

  "robbers-cave": {
    title: "Robber's Cave",
    image: "/images/places/robbers-cave.webp",
    description:
      "Robber's Cave is a famous natural attraction where visitors can walk through a river flowing inside a cave.",
    rating: "4.8",
    reviews: "201",
    category: "Natural Attraction",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const place = locations[slug as keyof typeof locations];

  if (!place) {
    return { title: "Place Not Found | DoonMeet" };
  }

  return {
    title: `${place.title} — Dehradun | DoonMeet`,
    description: place.description,
    openGraph: {
      title: `${place.title} | DoonMeet`,
      description: place.description,
      images: [place.image],
      url: `https://doonmeet.in/places/${slug}`,
    },
  };
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const place = locations[slug as keyof typeof locations];

  if (!place) {
    return <div>Location not found</div>;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: place.title,
    description: place.description,
    image: `https://doonmeet.in${place.image}`,
    url: `https://doonmeet.in/places/${slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dehradun",
      addressRegion: "Uttarakhand",
      addressCountry: "IN",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: place.rating,
      reviewCount: place.reviews,
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <Image src={place.image} alt={place.title} fill priority className="object-cover" />

        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-6 pb-12">
          <div>
            <p
              className="mb-2"
              style={{
                color: "rgb(var(--primary))",
              }}
            >
              📍 {place.category}
            </p>

            <h1 className="text-4xl font-bold text-white md:text-5xl">{place.title}</h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="mb-4 text-2xl font-bold">About This Place</h2>

            <p
              className="leading-8"
              style={{
                color: "rgb(var(--muted))",
              }}
            >
              {place.description}
            </p>
          </div>

          <div
            className="rounded-2xl border p-6"
            style={{
              backgroundColor: "rgb(var(--surface))",
              borderColor: "rgb(var(--border))",
            }}
          >
            <h3 className="mb-4 font-semibold">Quick Facts</h3>

            <div className="space-y-3">
              <p>📍 Dehradun</p>
              <p>⭐ {place.rating} Rating</p>
              <p>💬 {place.reviews} Reviews</p>
              <p>📸 Popular Photography Spot</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="mb-8 text-2xl font-bold">Visitor Reviews</h2>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border p-6">
            <div className="mb-3">⭐⭐⭐⭐⭐</div>
            <p className="mb-4">Amazing place for evening walks and photography.</p>
            <span className="font-medium">— Ravish</span>
          </div>

          <div className="rounded-2xl border p-6">
            <div className="mb-3">⭐⭐⭐⭐</div>
            <p className="mb-4">One of the best landmarks in Dehradun.</p>
            <span className="font-medium">— Aman</span>
          </div>

          <div className="rounded-2xl border p-6">
            <div className="mb-3">⭐⭐⭐⭐⭐</div>
            <p className="mb-4">Great meetup spot with friends.</p>
            <span className="font-medium">— Priya</span>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <h2 className="mb-8 text-2xl font-bold">Community Discussion</h2>

        <div className="rounded-2xl border p-6">
          <div className="mb-6 rounded-xl border p-4">Write a comment...</div>

          <div className="space-y-6">
            <div>
              <p className="font-semibold">Rohit</p>
              <p>Best time to visit?</p>
            </div>

            <div>
              <p className="font-semibold">Aman</p>
              <p>Evening around sunset is perfect.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
