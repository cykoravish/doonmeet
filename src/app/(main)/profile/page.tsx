import { redirect } from "next/navigation";
import OwnProfileClient from "@/components/profile/OwnProfileClient";
import { getSessionUser } from "@/lib/getSessionUser";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("My Profile");

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/profile");

  return <OwnProfileClient user={user} />;
}