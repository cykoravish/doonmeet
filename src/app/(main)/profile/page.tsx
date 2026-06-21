import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import OwnProfileClient from "@/components/profile/OwnProfileClient";

export const metadata: Metadata = {
  title: "My Profile | DoonMeet",
};

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.ACCESS_TOKEN_SECRET
);

async function getMe() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;

    await jwtVerify(token, ACCESS_TOKEN_SECRET);

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

export default async function ProfilePage() {
  const user = await getMe();
  if (!user) redirect("/login?redirect=/profile");

  return <OwnProfileClient user={user} />;
}