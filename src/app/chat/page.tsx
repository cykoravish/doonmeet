import type { Metadata } from "next";
import { Suspense } from "react";
import ChatTabs from "@/components/chat/ChatTabs";
import { getSessionUser } from "@/lib/getSessionUser";

export const metadata: Metadata = {
  title: "Chat | DoonMeet",
  description: "Join the public chat and message people one-on-one, across Dehradun in real time.",
};

export default async function ChatPage() {
  const currentUser = await getSessionUser();

  return (
    <Suspense fallback={null}>
      <ChatTabs currentUser={currentUser} />
    </Suspense>
  );
}
