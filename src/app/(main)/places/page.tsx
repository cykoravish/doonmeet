import { Suspense } from "react";
import { getAllPlacesWithRatings } from "@/lib/places";
import PlacesExplorer from "@/components/places/PlacesExplorer";
import PageHeader from "@/components/shared/PageHeader";
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
    <div className="mx-auto max-w-6xl px-4 pt-5 pb-8 sm:px-6 sm:pt-8">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Places", path: "/places" }])} />

      <PageHeader
        title="Places in Dehradun"
        description="Clock Tower, Robber's Cave, cafes and weekend spots — reviewed by people who've been there."
      />

      <Suspense fallback={null}>
        <PlacesExplorer places={places} />
      </Suspense>
    </div>
  );
}
