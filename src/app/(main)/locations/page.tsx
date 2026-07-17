import type { Metadata } from "next";
import LocationsClient from "@/components/locations/LocationsClient";
import { getSessionUser } from "@/lib/getSessionUser";

export const metadata: Metadata = {
  title: "Live Map — People in Dehradun | DoonMeet",
  description:
    "See where people are in Dehradun right now. Check in and let others know you're around.",
};

async function getLocations() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/locations`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.locations ?? [];
  } catch {
    return [];
  }
}

export default async function LocationsPage() {
  const [currentUser, locations] = await Promise.all([getSessionUser(), getLocations()]);

  return <LocationsClient currentUser={currentUser} initialLocations={locations} />;
}
