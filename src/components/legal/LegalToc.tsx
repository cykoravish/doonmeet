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
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );

    headings.forEach((h) => observerRef.current?.observe(h));
    return () => observerRef.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.id).join(",")]);

  function handleClick(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top: y, behavior: "smooth" });
    setActiveId(id);
  }

  return (
    <>
      {/* Desktop — sticky sidebar */}
      <nav
        className="sticky top-24 hidden max-h-[calc(100vh-7rem)] shrink-0 basis-56 flex-col gap-0.5 overflow-y-auto pb-10 lg:flex"
        aria-label="Document sections"
      >
        <p
          className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest"
          style={{ color: "rgb(var(--muted))" }}
        >
          On this page
        </p>
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className="flex items-start gap-2 rounded-lg px-3 py-1.5 text-left text-xs leading-snug transition-colors"
              style={{
                backgroundColor: isActive ? "rgb(var(--primary) / 0.08)" : "transparent",
                color: isActive ? "rgb(var(--primary))" : "rgb(var(--muted))",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <span className="font-[family-name:var(--font-geist-mono)] shrink-0 opacity-70">
                {item.number}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Mobile — sticky horizontal chip row */}
      <div
        className="sticky top-16 z-30 -mx-6 mb-6 overflow-x-auto border-b px-6 py-3 backdrop-blur-md lg:hidden"
        style={{
          borderColor: "rgb(var(--border))",
          backgroundColor: "rgb(var(--background) / 0.92)",
        }}
      >
        <div className="flex w-max gap-2">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  backgroundColor: isActive ? "rgb(var(--primary))" : "rgb(var(--surface))",
                  borderColor: isActive ? "rgb(var(--primary))" : "rgb(var(--border))",
                  color: isActive ? "white" : "rgb(var(--muted))",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}