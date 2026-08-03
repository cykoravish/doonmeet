# DoonMeet UI Design Skill

Use this whenever building or redesigning any page/component in the DoonMeet app. It captures
the project's existing design system so new UI stays visually consistent, responsive, and
accessible across the light ("doon") and dark ("night") themes.

## Design tokens (source: `src/app/globals.css`)

Colors are CSS variables (RGB triplets) exposed to Tailwind v4 via `@theme inline`, so use them
as normal Tailwind utility classes — **don't hardcode hex colors or write manual inline
`style={{ backgroundColor: ... }}` unless doing something Tailwind can't express (e.g. a
computed gradient stop or a box-shadow ring trick).**

| Utility class | Meaning |
|---|---|
| `bg-background` / `text-text` | page background / default text |
| `bg-surface` | card/panel background |
| `bg-primary`, `text-primary`, `border-primary` | brand green (main CTA, links, icons) |
| `bg-primary-light` | lighter green, good for gradients with `primary` |
| `bg-accent`, `text-accent` | warm amber accent (badges, highlights) |
| `text-muted` | secondary/supporting text |
| `border-border` | default border color |

Both themes (`[data-theme="doon"]` light, `[data-theme="night"]` dark) are already tuned — never
introduce a new color, always reuse the tokens above so both themes stay correct automatically.

## Layout & spacing conventions

- Page content wrapped in `mx-auto max-w-2xl` (profile-style pages) or `max-w-7xl` (nav/dashboard
  style pages), with horizontal padding `px-4 sm:px-6`.
- Cards: `rounded-2xl border border-border bg-surface`, inner padding `p-5` or `p-6`.
- Buttons/pills: `rounded-xl` for buttons, `rounded-full` for avatars/tags/badges.
- Consistent icon set: `lucide-react`, sized `14`–`20` for inline icons.

## Responsive rules (mandatory)

1. **Never pull multi-line or variable-length text up with a negative margin.** Only pull up a
   fixed-size element (like an avatar) with `-mt-*`; keep text (`name`, `bio`, etc.) in normal
   flow *below* the avatar with its own `mt-*`, never inside the same negatively-margined block.
   This prevents banner/content overlap bugs on small screens or with long bio text.
2. Design mobile-first: default classes target the smallest viewport (~320px), then layer
   `sm:` / `md:` / `lg:` for larger screens. Test the layout mentally at 320px, 375px, 768px,
   1024px+.
3. Any element that overlaps another (avatar over a banner, floating badge, etc.) needs an
   explicit `relative z-10` on the overlapping element and `overflow-hidden` + no explicit
   z-index on the element being overlapped, so stacking order is unambiguous.
4. Avatars/images always get a fixed `width`/`height` pair matching the largest rendered size,
   with Tailwind `w-*/h-*` classes controlling actual responsive display size — never let an
   avatar's display size be larger than its intrinsic `width`/`height` props (blurring risk).
5. Long dynamic content (names, bios, addresses) must have `truncate`, `line-clamp-*`, or wrap
   safely (`break-words`) — never assume short placeholder text.

## Visual polish checklist

- Prefer soft gradients (`bg-gradient-to-br from-primary to-primary-light`) over flat fills for
  hero/banner sections — feels more premium.
- Use subtle `shadow-*` and `hover:opacity-90` / `hover:scale-[1.02]` transitions on interactive
  elements (buttons, cards) rather than harsh color swaps.
- Stat blocks / metrics: icon on top, bold number, small muted label — consistent across the app.
- Keep decorative SVG accents (e.g. the Doon Valley ridgeline motif used on banners) — they're
  part of the brand identity — but always constrain them inside an `overflow-hidden relative`
  container with fixed height so they can't inflate layout.

## Workflow

1. Read the target page/component fully first.
2. Identify every dynamic data field (could be empty, very long, or missing) and design for the
   worst case, not just the happy path shown in a screenshot.
3. Reuse existing shared components (`src/components/ui/*`, `src/components/shared/*`) instead of
   inventing new patterns where one already exists.
4. Rebuild with the rules above, then double check no negative-margin block contains variable
   height text overlapping a fixed-height container.
