"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe2, Lock, MessageCircle, Users2 } from "lucide-react";
import ChatRoom from "./ChatRoom";
import MessagesPanel from "./MessagesPanel";
import AllUsersPanel from "./AllUsersPanel";
import { buttonClasses } from "@/components/ui/Button";

interface CurrentUser {
  _id: string;
  name: string;
  avatar: string | null;
}

interface ChatTabsProps {
  currentUser: CurrentUser | null;
}

export default function ChatTabs({ currentUser }: ChatTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const dmParam = searchParams.get("dm");
  const [tab, setTab] = useState<"public" | "messages">(dmParam ? "messages" : "public");
  const [pendingDmUserId, setPendingDmUserId] = useState<string | null>(dmParam);
  // On phones an open DM is full-screen — this header hides so the
  // conversation gets every pixel.
  const [dmOpen, setDmOpen] = useState(false);
  const [unreadDms, setUnreadDms] = useState(0);

  // Members panel — lives up here (not inside ChatRoom) so the trigger stays
  // visible and working no matter which tab is active. Visibility rides on
  // the URL (?members=1) so the back button, after following a member to
  // their profile, reopens it.
  const membersOpen = searchParams.get("members") === "1";
  const [counts, setCounts] = useState<{ total: number; online: number } | null>(null);

  const loadCounts = useCallback(() => {
    fetch("/api/users/count")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCounts({ total: d.total, online: d.online ?? 0 });
      })
      .catch(() => {});
  }, []);

  // Member/online counts — on mount and whenever the tab regains focus
  // (cheap, and keeps "N online" honest without polling).
  useEffect(() => {
    loadCounts();
    window.addEventListener("focus", loadCounts);
    return () => window.removeEventListener("focus", loadCounts);
  }, [loadCounts]);

  // Unread DM badge for the Messages tab (one request per chat visit).
  useEffect(() => {
    if (!currentUser) return;
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const total = (d.conversations ?? []).reduce(
          (sum: number, c: { unreadCount?: number }) => sum + (c.unreadCount ?? 0),
          0
        );
        setUnreadDms(total);
      })
      .catch(() => {});
  }, [currentUser]);

  // If the ?dm= param changes (e.g. clicking "Message" again from another
  // profile while already on this page), pick it up.
  useEffect(() => {
    if (dmParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab("messages");
      setPendingDmUserId(dmParam);
    }
  }, [dmParam]);

  function openMembersPanel() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("members", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const closeMembersPanel = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("members");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  function clearDmParam() {
    setPendingDmUserId(null);
    // Only touch the URL if a ?dm= param is actually there.
    if (searchParams.get("dm")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("dm");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  function switchTab(next: "public" | "messages") {
    setTab(next);
    // The Messages list shows per-conversation counts itself.
    if (next === "messages") setUnreadDms(0);
  }

  // "Message" from the public chat menu — switch tabs directly instead of
  // relying on a same-page URL change.
  function startDm(userId: string) {
    setPendingDmUserId(userId);
    switchTab("messages");
  }

  const canUseMessages = !!currentUser;
  const hideHeaderOnMobile = tab === "messages" && dmOpen;
  const online = counts?.online ?? 0;

  const tabClass = (active: boolean) =>
    `flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[11px] px-2 text-[15px] whitespace-nowrap transition-colors ${
      active ? "bg-surface font-bold text-text shadow-sm" : "font-semibold text-muted hover:text-text"
    }`;

  return (
    <div className="flex h-full flex-col">
      {/* Chat header — one compact row: back · Public/Messages · people.
          On phones this replaces the site navbar (hidden in the chat layout). */}
      <header
        className={`${
          hideHeaderOnMobile ? "hidden md:flex" : "flex"
        } h-16 shrink-0 items-center gap-2 border-b border-border bg-surface px-2 sm:px-4`}
      >
        <Link
          href="/"
          aria-label="Back to home"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-text hover:bg-surface-2 md:hidden"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </Link>

        <div
          role="tablist"
          aria-label="Chat"
          className="flex min-w-0 flex-1 gap-1 rounded-[14px] bg-surface-2 p-1 md:max-w-sm md:flex-none md:basis-80"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "public"}
            onClick={() => switchTab("public")}
            className={tabClass(tab === "public")}
          >
            <Globe2 size={17} aria-hidden="true" />
            Public<span className="hidden min-[400px]:inline">&nbsp;chat</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "messages"}
            onClick={() => (canUseMessages ? switchTab("messages") : router.push("/signup"))}
            className={tabClass(tab === "messages")}
            title={!canUseMessages ? "Sign up to send direct messages" : undefined}
          >
            {canUseMessages ? (
              <MessageCircle size={17} aria-hidden="true" />
            ) : (
              <Lock size={15} aria-hidden="true" />
            )}
            Messages
            {unreadDms > 0 && tab !== "messages" && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-on-primary">
                {unreadDms > 9 ? "9+" : unreadDms}
                <span className="sr-only"> unread</span>
              </span>
            )}
          </button>
        </div>

        {/* People — online count doubles as live social proof */}
        <button
          type="button"
          onClick={openMembersPanel}
          aria-haspopup="dialog"
          aria-expanded={membersOpen}
          aria-label={
            online > 0 ? `${online} people online — see everyone` : "See people in Dehradun"
          }
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-[14px] bg-primary-soft px-3 text-sm font-bold text-primary-fg transition-colors hover:bg-primary hover:text-on-primary md:ml-auto"
        >
          {online > 0 ? (
            <>
              <span className="h-2 w-2 rounded-full bg-online" aria-hidden="true" />
              <span>{online}</span>
              <span className="hidden sm:inline">online</span>
            </>
          ) : (
            <Users2 size={18} aria-hidden="true" />
          )}
          <span className="hidden md:inline">
            · {counts ? `See ${counts.total} Dehradunis` : "See Dehradunis"}
          </span>
        </button>
      </header>

      <div className="min-h-0 flex-1">
        {tab === "public" && (
          <ChatRoom currentUser={currentUser} onStartDm={startDm} />
        )}

        {tab === "messages" &&
          (canUseMessages ? (
            <MessagesPanel
              currentUser={currentUser}
              initialDmUserId={pendingDmUserId}
              onDmParamConsumed={clearDmParam}
              onConversationOpenChange={setDmOpen}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary-soft text-primary-fg">
                <Lock size={24} aria-hidden="true" />
              </span>
              <p className="font-bold">Sign up to message people</p>
              <p className="mt-1 max-w-xs text-[15px] text-muted">
                Create a free account to start one-on-one conversations with people you meet on DoonMeet.
              </p>
              <Link href="/signup" className={buttonClasses("primary", "md", "mt-4")}>
                Sign up free
              </Link>
            </div>
          ))}
      </div>

      <AllUsersPanel
        open={membersOpen}
        onClose={closeMembersPanel}
        currentUserId={currentUser?._id ?? null}
        canMessage={canUseMessages}
      />
    </div>
  );
}
