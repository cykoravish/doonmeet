
import Navbar from "@/components/layout/Navbar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { getSessionUser } from "@/lib/getSessionUser";
import Footer from "@/components/layout/Footer";



export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <>
      <Navbar user={user} />
      <main className="pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav isLoggedIn={!!user} />
    </>
  );
}
