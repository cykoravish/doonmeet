import HeroSection from "@/components/home/HeroSection";
import QuickActions from "@/components/home/QuickActions";
import PopularPlaces from "@/components/home/PopularPlaces";
import ExploreCategories from "@/components/home/ExploreCategories";
import AboutAndFaq from "@/components/home/AboutAndFaq";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "DoonMeet — Events, Communities & People in Dehradun",
  absoluteTitle: true,
  description:
    "Find events happening in Dehradun, join local communities, discover places and chat with people nearby. DoonMeet is free and made for the Doon Valley.",
  path: "/",
  keywords: [
    "Dehradun",
    "DoonMeet",
    "Doon Valley",
    "Dehradun events",
    "Dehradun communities",
    "meet people in Dehradun",
    "things to do in Dehradun",
    "places to visit in Dehradun",
  ],
});

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <QuickActions />
      <PopularPlaces />
      <ExploreCategories />
      <AboutAndFaq />
    </>
  );
}
