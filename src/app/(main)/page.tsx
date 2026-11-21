import HeroSection from "@/components/home/HeroSection";
import WelcomeHeader from "@/components/home/WelcomeHeader";
import QuickActions from "@/components/home/QuickActions";
import LiveChatCard from "@/components/home/LiveChatCard";
import LatestPosts from "@/components/home/LatestPosts";
import UpcomingEvents from "@/components/home/UpcomingEvents";
import PopularPlaces from "@/components/home/PopularPlaces";
import CommunitiesStrip from "@/components/home/CommunitiesStrip";
import AboutAndFaq from "@/components/home/AboutAndFaq";
import SupportCard from "@/components/home/SupportCard";
import { isSupportEnabled } from "@/lib/support";
import { getSessionUser } from "@/lib/getSessionUser";
import { getHomeData } from "@/lib/home";
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

export default async function HomePage() {
  // getSessionUser is request-cached, so this doesn't repeat the navbar's lookup.
  const [user, data] = await Promise.all([getSessionUser(), getHomeData()]);
  const isLoggedIn = !!user;

  if (isLoggedIn) {
    // Logged-in: an app-style dashboard — straight to what's happening.
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-7 px-4 pt-5 pb-8 sm:px-6 sm:pt-8">
        <WelcomeHeader name={user.name} />
        <LiveChatCard onlineCount={data.onlineCount} />
        <QuickActions />
        <LatestPosts posts={data.posts} isLoggedIn />
        <UpcomingEvents events={data.events} isLoggedIn />
        <CommunitiesStrip communities={data.communities} />
        <PopularPlaces places={data.places} />
        {isSupportEnabled() && <SupportCard />}
      </div>
    );
  }

  // Guest (and what search engines see): hero, live proof of activity,
  // real content, then About + FAQ.
  return (
    <>
      <HeroSection onlineCount={data.onlineCount} />
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 pb-4 sm:px-6 lg:max-w-4xl">
        <LiveChatCard onlineCount={data.onlineCount} />
        <LatestPosts posts={data.posts} isLoggedIn={false} />
        <UpcomingEvents events={data.events} isLoggedIn={false} />
        <CommunitiesStrip communities={data.communities} />
        <PopularPlaces places={data.places} />
        {isSupportEnabled() && <SupportCard />}
      </div>
      <AboutAndFaq />
    </>
  );
}
