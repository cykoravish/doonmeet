import type { Viewport } from "next";
import Navbar from "@/components/layout/Navbar";
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
    // Chat manages its own internal scrolling (the message list scrolls,
    // everything else stays put), locked to the visible viewport.
    //
    // Phones get a full-screen, app-style chat: the site navbar is hidden
    // below md (ChatTabs has its own back button) and there is no bottom
    // nav, so the keyboard + composer get the space instead of chrome.
    // The navbar stays MOUNTED (just display:none) so its notifications
    // socket keeps working — new-DM sounds still play while chatting.
    <ChatViewportShell>
      <div className="hidden md:block">
        <Navbar user={user} />
      </div>
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
    </ChatViewportShell>
  );
}
