import { redirect } from "next/navigation";
import type { Metadata } from "next";
import OwnProfileClient from "@/components/profile/OwnProfileClient";
import { getSessionUser } from "@/lib/getSessionUser";

export const metadata: Metadata = {
  title: "My Profile | DoonMeet",
};

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/profile");

  return <OwnProfileClient user={user} />;
}