import type { Metadata } from "next";
import ChatRoom from "@/components/chat/ChatRoom";
import { getSessionUser } from "@/lib/getSessionUser";

export const metadata: Metadata = {
  title: "Chat | DoonMeet",
  description: "Join the public chat and connect with people across Dehradun in real time.",
};

export default async function ChatPage() {
  const currentUser = await getSessionUser();

  return <ChatRoom currentUser={currentUser} />;
}