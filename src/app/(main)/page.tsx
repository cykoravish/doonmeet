import HeroSection from "@/components/home/HeroSection";
import QuickActions from "@/components/home/QuickActions";
import PopularPlaces from "@/components/home/PopularPlaces";
import ExploreCategories from "@/components/home/ExploreCategories";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DoonMeet — Connect with Dehradun",
  description:
    "New in Dehradun or just tired of the same five people in your contacts? DoonMeet helps you find local events, join communities built around your interests, and meet people across the Doon Valley.",
  keywords: [
    "Dehradun",
    "DoonMeet",
    "Doon Valley",
    "Dehradun events",
    "Dehradun communities",
    "meet people Dehradun",
  ],
  alternates: { canonical: "https://doonmeet.in" },
  openGraph: {
    title: "DoonMeet — Connect with Dehradun",
    description: "Local events, real communities, and people worth meeting — right here in Dehradun.",
    url: "https://doonmeet.in",
    siteName: "DoonMeet",
    locale: "en_IN",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <QuickActions />
      <PopularPlaces />
      <ExploreCategories />
    </>
  );
}
