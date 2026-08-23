import type { Viewport } from "next";
import Navbar from "@/components/layout/Navbar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import ChatViewportShell from "@/components/chat/ChatViewportShell";
import { getSessionUser } from "@/lib/getSessionUser";

// Scoped to /chat only. Tells supporting mobile browsers to resize the
// actual content viewport (not just overlay it) when the on-screen keyboard
// opens/closes, which is the other half of the keyboard-gap fix alongside
// ChatViewportShell below.
export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
};

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    // Chat is the one page that manages its own internal scrolling (message
    // list scrolls, everything else stays put). Locking this shell to the
    // viewport height with overflow-hidden means the page itself can never
    // scroll — so an over-eager auto-scroll-to-bottom, or a mobile browser's
    // shifting address bar, can no longer push the tab row behind the
    // sticky navbar. Only /chat opts into this; every other route keeps
    // normal page scrolling untouched.
    <ChatViewportShell>
      <Navbar user={user} />
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      <MobileBottomNav />
    </ChatViewportShell>
  );
}