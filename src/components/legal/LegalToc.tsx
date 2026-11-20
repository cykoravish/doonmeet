"use client";

import { useEffect, useRef, useState } from "react";

export interface LegalTocItem {
  id: string;
  number: string;
  label: string;
}

export default function LegalToc({ items }: { items: LegalTocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const chipRowRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => !!el);

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top of the viewport that's intersecting
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const topMost = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b
          );
          setActiveId(topMost.target.id);
        }
      },
      // Top margin clears the sticky navbar + the phone chip row (~118px).
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 }
    );

    headings.forEach((h) => observerRef.current?.observe(h));
    return () => observerRef.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.id).join(",")]);

  // Phones: keep the active chip in view as the reader scrolls the document.
  // Only the chip row scrolls (sideways, instantly) — never the page.
  useEffect(() => {
    const row = chipRowRef.current;
    if (!row || row.offsetParent === null) return; // hidden on desktop
    const chip = row.querySelector<HTMLElement>(`[data-toc-id="${CSS.escape(activeId)}"]`);
    if (!chip) return;
    row.scrollTo({ left: Math.max(0, chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2) });
  }, [activeId]);

  // Real #anchor links (crawlable, shareable); JS only adds the smooth scroll.
  // LegalSection's scroll-margin keeps the heading clear of the sticky bars.
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  }

  return (
    <>
      {/* Desktop — sticky sidebar */}
      <nav
        className="sticky top-24 hidden max-h-[calc(100vh-7rem)] shrink-0 basis-56 flex-col gap-0.5 overflow-y-auto pb-10 lg:flex"
        aria-label="Document sections"
      >
        <p className="mb-2 px-3 text-xs font-semibold tracking-widest text-muted uppercase">On this page</p>
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              aria-current={isActive ? "true" : undefined}
              className={`flex items-baseline gap-2 rounded-lg px-3 py-1.5 text-sm leading-snug transition-colors ${
                isActive ? "bg-primary-soft font-semibold text-primary-fg" : "text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              <span className="shrink-0 font-mono text-xs opacity-70">{item.number}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Phones/tablets — chip row stuck right under the navbar (56px tall
          below md, 64px from md). Solid background: a blurred sticky bar
          repaints on every scroll frame on cheap phones. */}
      <nav
        ref={chipRowRef}
        aria-label="Document sections"
        className="sticky top-14 z-30 -mx-4 overflow-x-auto border-b border-border bg-background px-4 py-2.5 sm:-mx-6 sm:px-6 md:top-16 lg:hidden"
      >
        <div className="flex w-max gap-2">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                data-toc-id={item.id}
                onClick={(e) => handleClick(e, item.id)}
                aria-current={isActive ? "true" : undefined}
                className={`flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition-colors ${
                  isActive ? "bg-primary text-on-primary" : "bg-surface-2 text-muted hover:text-text"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
