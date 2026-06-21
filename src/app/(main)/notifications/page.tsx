import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import NotificationsClient from "@/components/notifications/NotificationsClient";

export const metadata: Metadata = {
  title: "Notifications | DoonMeet",
};

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.ACCESS_TOKEN_SECRET
);

async function getNotifications() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;

    await jwtVerify(token, ACCESS_TOKEN_SECRET);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications?limit=30`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

export default async function NotificationsPage() {
  const data = await getNotifications();
  if (!data) redirect("/login?redirect=/notifications");

  return (
    <NotificationsClient
      initialNotifications={data.notifications ?? []}
      initialUnreadCount={data.unreadCount ?? 0}
    />
  );
}