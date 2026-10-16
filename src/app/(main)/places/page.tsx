import { Suspense } from "react";
import { getAllPlacesWithRatings } from "@/lib/places";
import PlacesExplorer from "@/components/places/PlacesExplorer";
import { pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Places to Visit in Dehradun — Reviews & Local Tips",
  description:
    "Robber's Cave, Clock Tower, hidden cafes and weekend nature spots in Dehradun — honest reviews from people who've actually been there.",
  path: "/places",
  keywords: ["places to visit in Dehradun", "Dehradun tourist places", "cafes in Dehradun", "Dehradun nature spots"],
});
export const dynamic = "force-dynamic";

export default async function PlacesPage() {
  const places = await getAllPlacesWithRatings();

  return (
    <div>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Places", path: "/places" }])} />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p
          className="mb-2 text-sm font-semibold uppercase tracking-widest"
          style={{ color: "rgb(var(--primary))" }}
        >
          Discover
        </p>
        <h1 className="text-4xl font-black md:text-5xl">Explore Places in Dehradun</h1>
        <p className="mt-3 max-w-2xl" style={{ color: "rgb(var(--muted))" }}>
          Clock Tower, Robber&apos;s Cave, hidden cafes, weekend nature spots — rated and reviewed
          by people who&apos;ve actually been there.
        </p>

        <Suspense fallback={null}>
          <PlacesExplorer places={places} />
        </Suspense>
      </section>
    </div>
  );
}