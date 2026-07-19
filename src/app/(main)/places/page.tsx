import type { Metadata } from "next";
import { getAllPlacesWithRatings } from "@/lib/places";
import PlacesExplorer from "@/components/places/PlacesExplorer";

export const metadata: Metadata = {
  title: "Explore Places in Dehradun | DoonMeet",
  description:
    "Discover landmarks, attractions, cafes, nature spots and local experiences across Dehradun.",
};

export default async function PlacesPage() {
  const places = await getAllPlacesWithRatings();

  return (
    <div>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p
          className="mb-2 text-sm font-semibold uppercase tracking-widest"
          style={{ color: "rgb(var(--primary))" }}
        >
          Discover
        </p>
        <h1 className="text-4xl font-black md:text-5xl">Explore Places in Dehradun</h1>
        <p className="mt-3 max-w-2xl" style={{ color: "rgb(var(--muted))" }}>
          Discover landmarks, attractions, cafes, nature spots and local experiences across
          Dehradun.
        </p>

        <PlacesExplorer places={places} />
      </section>
    </div>
  );
}