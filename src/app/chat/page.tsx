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
    <Suspense fallback={null}>
      <ChatTabs currentUser={currentUser} />
    </Suspense>
  );
}
