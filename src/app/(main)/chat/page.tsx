import type { Metadata } from "next";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import ChatRoom from "@/components/chat/ChatRoom";

export const metadata: Metadata = {
  title: "Chat | DoonMeet",
  description: "Join the public chat and connect with people across Dehradun in real time.",
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

export default async function ChatPage() {
  const currentUser = await getCurrentUser();

  return <ChatRoom currentUser={currentUser} />;
}