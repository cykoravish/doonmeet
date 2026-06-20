import HeroSection from "@/components/home/HeroSection";
import QuickActions from "@/components/home/QuickActions";
import PopularPlaces from "@/components/home/PopularPlaces";
import ExploreCategories from "@/components/home/ExploreCategories";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DoonMeet — Connect with Dehradun",
  description:
    "DoonMeet is Dehradun's social platform. Discover events, join communities, explore popular places and connect with locals across the Doon Valley.",
  keywords: [
    "Dehradun",
    "DoonMeet",
    "Doon Valley",
    "Dehradun events",
    "Dehradun communities",
    "meet people Dehradun",
  ],
  openGraph: {
    title: "DoonMeet — Connect with Dehradun",
    description: "Discover events, join communities and meet locals in Dehradun.",
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