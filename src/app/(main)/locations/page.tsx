import type { Metadata } from "next";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import LocationsClient from "@/components/locations/LocationsClient";

export const metadata: Metadata = {
  title: "Live Map — People in Dehradun | DoonMeet",
  description:
    "See where people are in Dehradun right now. Check in and let others know you're around.",
};

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.ACCESS_TOKEN_SECRET
);

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
    if (!payload.userId) return null;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/users/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

async function getLocations() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/locations`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.locations ?? [];
  } catch {
    return [];
  }
}

export default async function LocationsPage() {
  const [currentUser, locations] = await Promise.all([
    getCurrentUser(),
    getLocations(),
  ]);

  return (
    <LocationsClient
      currentUser={currentUser}
      initialLocations={locations}
    />
  );
}