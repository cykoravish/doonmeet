"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Users, Navigation } from "lucide-react";
import CheckInButton from "./CheckInButton";
import PeopleOnMap from "./PeopleOnMap";
import Link from "next/link";

// Dynamic import — Leaflet can't run on server
const DehradunMap = dynamic(() => import("./DehradunMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full w-full items-center justify-center rounded-2xl"
      style={{ backgroundColor: "rgb(var(--surface))", minHeight: "500px" }}
    >
      <div className="text-center">
        <div className="mb-2 text-4xl">🗺️</div>
        <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          Loading map...
        </p>
      </div>
    </div>
  ),
});

interface LocationPin {
  userId: string;
  name: string;
  avatar: string | null;
  coords: { lat: number; lng: number };
  label: string | null;
  checkedInAt: string;
}

interface CurrentUser {
  _id: string;
  name: string;
  avatar: string | null;
  isGuest: boolean;
}

interface LocationsClientProps {
  currentUser: CurrentUser | null;
  initialLocations: LocationPin[];
}

export default function LocationsClient({
  currentUser,
  initialLocations,
}: LocationsClientProps) {
  const [locations, setLocations] = useState<LocationPin[]>(initialLocations);
  const [hasCheckedIn, setHasCheckedIn] = useState(
    initialLocations.some((l) => l.userId === currentUser?._id)
  );
  const [isVisible, setIsVisible] = useState(true);

  async function handleCheckIn(
    coords: { lat: number; lng: number },
    label: string | null
  ) {
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coords, label, isVisible: true }),
      });

      if (!res.ok) return;

      const data = await res.json();

      // Update local state
      setLocations((prev) => {
        const filtered = prev.filter((l) => l.userId !== currentUser?._id);
        return [
          ...filtered,
          {
            userId: currentUser!._id,
            name: currentUser!.name,
            avatar: currentUser!.avatar,
            coords,
            label,
            checkedInAt: new Date().toISOString(),
          },
        ];
      });
      setHasCheckedIn(true);
      setIsVisible(true);
    } catch {
      console.error("Check-in failed");
    }
  }

  async function handleToggleVisibility(visible: boolean) {
    try {
      await fetch("/api/locations/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: visible }),
      });

      setIsVisible(visible);

      if (!visible) {
        setLocations((prev) =>
          prev.filter((l) => l.userId !== currentUser?._id)
        );
      } else {
        const myPin = initialLocations.find(
          (l) => l.userId === currentUser?._id
        );
        if (myPin) setLocations((prev) => [...prev, myPin]);
      }
    } catch {
      console.error("Toggle visibility failed");
    }
  }

  async function handleRemove() {
    try {
      await fetch("/api/locations/me", { method: "DELETE" });
      setLocations((prev) =>
        prev.filter((l) => l.userId !== currentUser?._id)
      );
      setHasCheckedIn(false);
    } catch {
      console.error("Remove failed");
    }
  }

  return (
    <div className="min-h-screen">

      {/* Header */}
      <div
        className="border-b py-10"
        style={{
          backgroundColor: "rgb(var(--surface))",
          borderColor: "rgb(var(--border))",
        }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between">
            <div>
              <p
                className="mb-2 text-sm font-semibold uppercase tracking-widest"
                style={{ color: "rgb(var(--primary))" }}
              >
                Live Map
              </p>
              <h1 className="text-3xl font-black md:text-4xl">
                Who&apos;s around in Dehradun?
              </h1>
              <p
                className="mt-2 text-sm"
                style={{ color: "rgb(var(--muted))" }}
              >
                See where people are and let others know you&apos;re here.
              </p>
            </div>

            {/* Stats */}
            <div className="hidden items-center gap-6 sm:flex">
              <div className="text-center">
                <p
                  className="text-2xl font-black"
                  style={{ color: "rgb(var(--primary))" }}
                >
                  {locations.length}
                </p>
                <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                  People online
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* Map */}
          <div
            className="overflow-hidden rounded-2xl border"
            style={{
              borderColor: "rgb(var(--border))",
              height: "600px",
            }}
          >
            <DehradunMap
              pins={locations}
              currentUserId={currentUser?._id}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Check in section */}
            {currentUser && !currentUser.isGuest ? (
              <CheckInButton
                hasCheckedIn={hasCheckedIn}
                isVisible={isVisible}
                onCheckIn={handleCheckIn}
                onToggleVisibility={handleToggleVisibility}
                onRemove={handleRemove}
              />
            ) : currentUser?.isGuest ? (
              <div
                className="rounded-2xl border p-4 text-center"
                style={{
                  borderColor: "rgb(var(--border))",
                  backgroundColor: "rgb(var(--surface))",
                }}
              >
                <Navigation
                  size={24}
                  className="mx-auto mb-2"
                  style={{ color: "rgb(var(--muted))" }}
                />
                <p className="text-sm font-semibold">Sign up to check in</p>
                <p
                  className="mt-1 mb-3 text-xs"
                  style={{ color: "rgb(var(--muted))" }}
                >
                  Guests can view the map but can&apos;t share location
                </p>
                <Link
                  href="/signup"
                  className="block w-full rounded-xl py-2.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: "rgb(var(--primary))" }}
                >
                  Sign up free
                </Link>
              </div>
            ) : (
              <div
                className="rounded-2xl border p-4 text-center"
                style={{
                  borderColor: "rgb(var(--border))",
                  backgroundColor: "rgb(var(--surface))",
                }}
              >
                <MapPin
                  size={24}
                  className="mx-auto mb-2"
                  style={{ color: "rgb(var(--muted))" }}
                />
                <p className="text-sm font-semibold">Log in to check in</p>
                <p
                  className="mt-1 mb-3 text-xs"
                  style={{ color: "rgb(var(--muted))" }}
                >
                  Share your location and connect with people nearby
                </p>
                <Link
                  href="/login"
                  className="block w-full rounded-xl py-2.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: "rgb(var(--primary))" }}
                >
                  Log in
                </Link>
              </div>
            )}

            {/* People list */}
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: "rgb(var(--border))",
                backgroundColor: "rgb(var(--surface))",
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={15} style={{ color: "rgb(var(--primary))" }} />
                  <h2 className="text-sm font-bold">People on map</h2>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: "rgb(var(--primary) / 0.1)",
                    color: "rgb(var(--primary))",
                  }}
                >
                  {locations.length}
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <PeopleOnMap
                  pins={locations}
                  currentUserId={currentUser?._id}
                />
              </div>
            </div>

            {/* Popular spots */}
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: "rgb(var(--border))",
                backgroundColor: "rgb(var(--surface))",
              }}
            >
              <h2 className="mb-3 text-sm font-bold">Popular Spots</h2>
              <div className="space-y-2">
                {[
                  { name: "Clock Tower", emoji: "🏛️", area: "Paltan Bazaar" },
                  { name: "Rajpur Road", emoji: "☕", area: "Cafes & Food" },
                  { name: "FRI Campus", emoji: "🌲", area: "New Forest" },
                  { name: "Robber's Cave", emoji: "🏔️", area: "Anarwala" },
                ].map((spot) => (
                  <div
                    key={spot.name}
                    className="flex items-center gap-3 rounded-xl p-2.5"
                    style={{ backgroundColor: "rgb(var(--background))" }}
                  >
                    <span className="text-xl">{spot.emoji}</span>
                    <div>
                      <p className="text-xs font-semibold">{spot.name}</p>
                      <p
                        className="text-xs"
                        style={{ color: "rgb(var(--muted))" }}
                      >
                        {spot.area}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}