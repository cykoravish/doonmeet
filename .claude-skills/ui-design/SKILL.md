# DoonMeet UI Design Skill

Use this for **any** UI work in DoonMeet (new page, redesign, component, styling fix).
DoonMeet is a Dehradun-only local social platform — chat, posts, events, communities,
places. Most users are on **mobile, many on low-end Android phones**, and the site is
installable as a PWA. Three rules beat everything else:

1. **Smooth on a cheap phone.** No heavy animation, ever.
2. **Simple to use.** Big tap targets, clear labels, as few steps as possible.
3. **Best SEO.** Server-rendered content, proper metadata, semantic HTML.

Design direction: **"Doon Mist"** (light, `data-theme="doon"`) and **"Doon Night"**
(dark, `data-theme="night"`). Forest green = Dehradun's greenery; amber = Mussoorie
sunset, used only for highlights. Dark mode is green-tinted, never pure black, so long
chat sessions are easy on the eyes.

---

## 1. Tokens — use only these (source: `src/app/globals.css`)

Never hardcode hex/rgb in components, and never use inline token styles
(`style={{ color: "rgb(var(--primary-fg))" }}`) — use the classes below. Only SVG
`fill`/`stroke` attributes may use `rgb(var(--x))`. If a new colour is truly needed, add a
variable to both `:root` and `[data-theme="night"]` and register it in `@theme inline`.

| Class | Use for |
|---|---|
| `bg-background` | page background |
| `bg-surface` | cards, sheets, nav bars |
| `bg-surface-2` | inputs, chips, icon buttons, subtle fills |
| `border-border` | all borders/dividers |
| `text-text` / `text-muted` | body text / secondary text (muted passes 4.5:1) |
| `bg-primary` + `text-on-primary` | primary fills (buttons, active chip, FAB) |
| `text-primary-fg` | green **text/icons** (links, active nav). Never `text-primary` for text — it's too dark in night mode |
| `bg-primary-soft` | tinted backgrounds (selected rows, info boxes) |
| `bg-primary-light` | secondary green (sparingly) |
| `bg-accent-soft` + `text-accent-fg` | Sponsored labels, highlights, unread badges |
| `bg-accent` | small dots/badges only |
| `text-danger` / `bg-danger` | errors, destructive actions |
| `bg-online` | presence dot |

Fonts: body = **Mukta** (`font-sans`, default; has a Devanagari subset for Hindi posts that
only downloads when Hindi text appears). Headings = **Bricolage Grotesque** (`font-display`;
`h1`–`h3` get it automatically). Mono = `font-mono` (legal pages only).

Radii: `rounded-[14px]` buttons/inputs/icon buttons · `rounded-[20px]` cards ·
`rounded-[28px]` top of bottom sheets · `rounded-full` avatars/chips.

## 2. Primitives — reuse, don't re-invent (`src/components/ui/`)

| Component | Notes |
|---|---|
| `Button` | `variant`: primary / secondary / outline / ghost / danger · `size`: sm(40) / md(48) / lg(56) · `loading`. Default `className="w-full"`. For a `<Link>` that looks like a button use `buttonClasses(variant, size, extra)` |
| `IconButton` | 44×44, `label` is required (becomes aria-label) |
| `Input` | `label` / `hint` / `error`, label is linked via `useId`. 16px text so iOS doesn't zoom |
| `PasswordInput` | Same API as `Input`, with a 44px show/hide toggle |
| `SwitchRow` (`ui/Switch.tsx`) | Settings toggle row: `label`, `description`, `checked`, `onChange`, `saving`, `icon`. Real `role="switch"` |
| `Card` | `as` (div/article/section/li), `padding` none/md/lg. Border only, no heavy shadow |
| `Badge` | `tone` neutral/primary/solid/accent/danger, `size` sm/md. `badgeClasses()` for tappable chips |
| `Avatar` | next/image + initials fallback, stable tint per name, `online` dot. Decorative by default (`labelled` if standalone) |
| `Alert` | success / error / info with icon and correct `role` |
| `Divider` | optional `label` |

Icons: `lucide-react` only (no emoji as icons). Inline icons 16–20px, nav icons 22px.

**Shared building blocks** — check these before writing a new one:

| Component | Use for |
|---|---|
| `shared/PageHeader` | Page `h1` + description + optional `action` (list pages) |
| `shared/FilterChips` | Horizontal filter row of real links (`items: {label, href, active}`) — crawlable, works without JS |
| `shared/BackLink` | "← Back to …" link at the top of detail pages |
| `shared/EmptyState` | Lucide `icon` + title + description + `action` (always offer the next step) |
| `shared/CategoryIcon` | Community category icon (a component, so it isn't re-created in render) |
| `shared/UserLink` | Name/avatar link to a profile |
| `safety/SafetySheet` | Report / Block bottom sheet (modes `report` / `block`); `safety/ProfileSafetyMenu` on profiles |
| `promotions/PromoteButton` | Starts the Razorpay checkout for a sponsored post |
| `events/ShareButton` | Native share sheet with copy-link fallback (`variant` compact/block) |
| `layout/CreateSheet` | The bottom-nav **+ Create** sheet — add new "create" entry points here |

## 3. Mobile-first layout

- Write base classes for a **360px** screen, then add `sm:` / `md:` / `lg:`.
- Page side padding `px-4` (mobile) → `sm:px-6`. Content width `max-w-2xl` for feeds/detail
  pages, `max-w-7xl` for wide pages.
- Tap targets ≥ 44px. Input text ≥ 16px. Body text ≥ 15px; small meta text ≥ 13px.
- Primary actions sit in the thumb zone (bottom half) on mobile: bottom nav, its centre
  **+ Create** button, sticky composers, bottom sheets instead of centred modals.
- Respect safe areas: `pb-[env(safe-area-inset-bottom)]` on anything fixed to the bottom.
- Long user text (names, bios, posts) must `truncate`, `line-clamp-*` or `break-words`.
- Never pull variable-height text up with a negative margin; only fixed-size elements
  (an avatar over a banner) may use `-mt-*`, with `relative z-10`.
- No horizontal page scroll. Chip rows may scroll horizontally (`overflow-x-auto`) if the
  next chip visibly peeks.
- The sticky navbar is `h-14` (56px) below `md` and `h-16` (64px) from `md`. Anything stuck
  under it uses `top-14 md:top-16`; sections reached by `#anchor` need a matching
  `scroll-mt-*` so the heading isn't hidden behind the sticky bars.

## 4. Performance budget (low-end Android)

**Allowed motion:** `transition-colors` / `opacity` / `transform`, 120–200ms. Tap feedback
via `.btn-springy` (scale 0.97 on `:active`). Bottom-sheet slide-up and toast fade already
exist in `globals.css` — reuse them. Everything respects `prefers-reduced-motion`.

**Never:**
- animation libraries (Framer Motion, GSAP, Lottie…), scroll-triggered reveals, staggers,
  parallax, JS scroll listeners for visuals
- hover `scale-*` on cards/lists, animated gradients, particles, custom cursors
- `backdrop-blur` on large or sticky areas (navbars, chip rows — it repaints on every
  scroll frame); use a solid `bg-background` / `bg-surface`. Big multi-layer shadows on
  repeated cards
- autoplay video, unoptimised images, raw `<img>`

**Always:**
- Server Components by default; `"use client"` only on the small interactive piece.
- `next/image` with correct `sizes`; `priority` only on the real LCP image.
- Shallow DOM; skeletons (static `bg-surface-2` blocks, no shimmer) while loading.

## 5. SEO rules

- Page content that should rank is rendered on the server (no client-only fetch for the
  main content of a public page).
- Every route exports metadata through `pageMetadata()` / `noIndexMetadata()` from
  `src/lib/seo.ts`; add `breadcrumbJsonLd()` / JSON-LD where it fits.
- One `<h1>` per page, then `h2`/`h3` in order. Use `<main>`, `<nav>`, `<article>`,
  `<header>`, `<footer>`, real `<a href>` links (not `onClick` navigation) so crawlers can
  follow them. Internal links use `next/link` `<Link>` (client navigation + prefetch — no
  full reload on slow phones); in-page tables of contents use real `#id` anchors.
- Filters and categories are URL-based (`/posts?category=jobs`) with their own metadata, so
  each one can rank as a landing page.
- Meaningful `alt` on content images; empty `alt` on decorative ones.
- Keep LCP fast: fonts via `next/font` (already set up), no layout shift (fixed image sizes).

## 6. Accessibility & UX

- Contrast ≥ 4.5:1 for text in **both** themes — check night mode every time.
- Real `<button>` / `<a>`; icon-only controls get `aria-label` (IconButton enforces it).
- Visible focus is global (`:focus-visible` outline) — don't remove it.
- Empty states always tell the user what to do next (a button to create the first post or
  event), never just "Nothing here".
- Copy is friendly and local; light Hinglish is fine ("Kya chal raha hai Doon mein?").
- Paid placements always carry a visible **"Sponsored"** label (ASCI) — reuse the strip in
  `PostCard`, never style an ad like a normal post.

## 7. Project helpers — use these, don't re-implement

| Need | Use |
|---|---|
| Real-time (Socket.IO) | `useSocket(userId)` + `onConnected(socket, join)` from `src/lib/socket-client.ts` — one shared connection per tab. Never call `io()` directly; on cleanup remove only your own handlers (`socket.off(event, handler)`) and leave the rooms you joined |
| Event / IST dates | `src/lib/dates.ts` — `eventDay`, `eventMonth`, `eventWeekday`, `eventShortDate`, `eventLongDate`, `eventTime`. Never `toLocaleString()` without a time zone (the server runs in UTC) |
| Post categories | `src/lib/postCategories.ts` — labels, hints, SEO copy, `categoryQuery()` |
| Community categories | `src/lib/communityCategories.ts` + `shared/CategoryIcon` |
| Sponsored-post price/days | `src/lib/promotionPlans.ts` labels — never hardcode "₹49" or "7 days" |
| Grievance officer, timelines | `src/lib/legal.ts` |
| Metadata / JSON-LD | `pageMetadata()`, `noIndexMetadata()`, `breadcrumbJsonLd()` (`src/lib/seo.ts`) + `components/seo/JsonLd` |

React Compiler lint rules to respect: nothing impure in render (`Date.now()`,
`Math.random()` → move to an effect/handler or the server), never define or call a
component-returning function during render (make it a real component), and avoid
`setState` directly inside effects.

## 8. Checklist before finishing any UI change

- [ ] Tokens only, works in Doon Mist **and** Doon Night
- [ ] Looks right at 360px first, then larger screens
- [ ] Tap targets ≥ 44px, inputs 16px
- [ ] No banned animation / blur / heavy shadow
- [ ] Server Component unless interaction needs a client one
- [ ] `next/image` + `sizes`; metadata + semantic headings for SEO
- [ ] Reused `src/components/ui/` primitives
- [ ] Long/empty/missing data handled
