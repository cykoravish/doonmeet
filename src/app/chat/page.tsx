import { Suspense } from "react";
import ChatTabs from "@/components/chat/ChatTabs";
import { getSessionUser } from "@/lib/getSessionUser";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Dehradun Chat — Talk to People Nearby",
  description:
    "Join DoonMeet's public chat room to talk with people across Dehradun, or message someone one-on-one. Free to join.",
  path: "/chat",
  keywords: ["Dehradun chat", "chat with people in Dehradun", "meet people in Dehradun"],
});

export default async function ChatPage() {
  const currentUser = await getSessionUser();

  return (
    <>
      {/* The chat UI is all interactive; this gives the page a real H1 for
          search engines and screen readers without adding visual chrome. */}
      <h1 className="sr-only">Dehradun public chat — talk to people nearby</h1>
      <Suspense fallback={null}>
        <ChatTabs currentUser={currentUser} />
      </Suspense>
    </>
  );
}
