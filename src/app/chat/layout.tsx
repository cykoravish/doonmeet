import Navbar from "@/components/layout/Navbar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { getSessionUser } from "@/lib/getSessionUser";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <>
      <Navbar user={user} />
      <main>{children}</main>
      <MobileBottomNav />
    </>
  );
}