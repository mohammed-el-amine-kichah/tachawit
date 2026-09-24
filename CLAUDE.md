# CLAUDE.md — Tachawit

Gamified web app to learn **Tachawit** (Chaoui / Aurès Tamazight), the Amazigh language of the Aurès region of northeastern Algeria. Mainly oral language → audio from native speakers is the core of the product.

Full product spec: @docs/SPEC.md — read it before starting any new phase.

## Golden rules
1. **Content is data, never code.** Lessons, quizzes, entries, audio, map nodes, culture notes live in Supabase and are managed from `/admin`. Never hardcode learning content in components. The only exception is `supabase/seed.sql`.
2. **Build one phase at a time** (see "Phases" below). When a phase is done: run lint + typecheck + build, then stop and summarize what was built, what's left, and any decision you need from me. Don't start the next phase on your own.
3. **Mobile-first.** Design and test for a ~380px mid-range Android phone first, then scale up.
4. **Security in the database, not the UI.** Every table has Row Level Security. Admin actions are enforced by RLS policies and server-side checks, never by hiding buttons.
5. **Ask before** adding a new dependency, changing the database schema outside a migration, or changing the design tokens.

## Stack
- Next.js (App Router) + TypeScript (strict), deployed on Vercel
- Tailwind CSS + shadcn/ui
- Framer Motion (UI animation), Lottie/Rive (celebrations, characters)
- Supabase: Postgres, Auth (magic link + Google), Storage, RLS
- next-intl — UI in `en`, `fr`, `ar`, Darja. `ar` and Darja are RTL. Darja's locale is `ar-DZ` (never `dz`, the ISO code for Dzongkha, which breaks number/plural formatting); it is served at `/dz` and uses the `dz` key in content JSON and `messages/dz.json`.
- Zod for validation, TanStack Query for client data where needed
- Package manager: **pnpm**
- Next.js 16 differs from older versions (e.g. `proxy.ts` replaces `middleware.ts`): read the bundled docs, see @AGENTS.md

## Commands
```bash
pnpm dev                 # local dev server
pnpm build               # production build — must pass before a phase is "done"
pnpm lint                # ESLint
pnpm typecheck           # tsc --noEmit
pnpm test                # Vitest unit tests (+ integration test when .env.local points at Supabase)
pnpm test:db             # pgTAP database tests (supabase/tests/database)
supabase start           # local Supabase
supabase db reset        # re-run migrations + seed
supabase migration new <name>
supabase gen types typescript --local > src/lib/supabase/types.ts
```
Regenerate Supabase types after every migration.

## Structure
```
src/
  app/
    [locale]/            # learner-facing routes (map, lesson, quiz, review, profile, culture, contribute, about)
    [locale]/admin/      # admin panel (role-protected)
    api/                 # route handlers (uploads, audio processing)
  components/
    ui/                  # shadcn primitives — don't restyle ad hoc, change tokens instead
    map/  lesson/  quiz/  audio/  admin/  shared/
  lib/
    supabase/            # clients (server/browser), generated types, queries
    srs/                 # spaced-repetition logic (pure functions, unit-tested)
    script/              # Latin / Arabic / Tifinagh rendering helpers
    audio/
  messages/              # next-intl UI strings: en.json fr.json ar.json dz.json
  styles/
supabase/
  migrations/
  seed.sql
docs/
  SPEC.md
```

## Domain model (short version — details in SPEC.md)
- `units` → `levels` (map nodes: lesson / quiz / review / boss / story, with x/y position and unlock rule)
- `entries` (word/phrase): `text_latin`, `text_arabic`, `text_tifinagh`, translations (en/fr/ar/dz), dialect/region tag
- `audio_clips` (linked to entry + speaker; optional slow version and word timestamps)
- `speakers` (region/village, **consent + date required before audio is published**)
- `lessons` and `quizzes` = ordered steps/questions stored as typed JSON, validated with Zod
- `user_progress`, `srs_items`, `submissions`, `culture_notes`
- Everything publishable has `status: 'draft' | 'published'`. Learners only ever see `published`.

## Language & script rules
- **Latin spelling convention:** `TODO — Djamel to decide` (e.g. standard Tamazight with ɣ ḥ ṭ ḍ ṣ ẓ ε č ǧ). Until decided, don't "correct" or normalize any Tachawit text — store it exactly as entered.
- Never machine-translate or invent Tachawit words. Placeholder content must be clearly marked `[PLACEHOLDER]`.
- Tachawit text always renders through the `<TachawitText entry={...} />` component, which respects the global script toggle and falls back to Latin if a script is missing.
- Dialect variation is shown, not treated as an error: display the region tag next to variants.
- UI strings go in `messages/*.json`, never inline. Add all four locales at once (use English as a clearly marked fallback if unsure).

## RTL
- Use logical Tailwind utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`) — never `ml-`, `mr-`, `left-`, `right-` for layout.
- Directional icons and animations (slide in, progress, arrows) must flip in RTL.
- Check every new screen in `ar` before calling it done.

## Design system
- Identity: Aurès landscapes + Amazigh geometric motifs (weaving, pottery, silver jewelry); ⵣ as a recurring mark.
- Tokens live in `src/styles/tokens.css` as CSS variables and are mapped into Tailwind. Palette: terracotta, ochre, deep indigo, cedar green, silver. Light (warm off-white) and dark (indigo night) themes.
- Fonts must support Tamazight Latin diacritics, Arabic, and Tifinagh (Noto Sans Tifinagh).
- Use tokens only — no raw hex values in components.

## Animation
- Framer Motion for all UI motion; shared variants in `src/lib/motion.ts` (no one-off magic numbers).
- Animate `transform` and `opacity` only. Keep interaction feedback < 200ms; celebrations may be longer but must be skippable.
- Respect `prefers-reduced-motion` everywhere: replace motion with fades or nothing.
- Animation must never block learning (no waiting for an animation to finish before the user can continue).

## Audio
- Audio is the core feature: large play control, waveform, slow mode, synced word highlighting when timestamps exist, tap-a-word to hear it.
- Lazy-load audio; preload the next lesson step only.
- Uploads are converted to a web-friendly format (AAC/Opus) server-side; store the original too.
- Every audio control needs an aria-label in the current locale.

## Admin panel
- Must be usable by a non-developer. Prefer visual builders, drag-and-drop, and live previews over raw forms.
- Every editor has: autosave draft, preview exactly as learners see it, and explicit Publish.
- Destructive actions ask for confirmation.
- Bulk CSV import for entries.

## Code conventions
- Server Components by default; `"use client"` only where needed.
- Data access through functions in `src/lib/supabase/queries/`, not scattered in components.
- Validate every form and every JSON content payload with Zod (shared schemas between admin and learner side).
- No `any`. No unused code or commented-out blocks.
- Small, focused components; one component per file.
- Unit-test pure logic (SRS scheduling, unlock rules, script fallback). UI testing is manual per phase unless I ask.

## Phases
1. Setup, design system, i18n + RTL, script toggle, Supabase schema + RLS + seed
2. Map with node states and unlock animations
3. Lesson player (audio, waveform, slow mode, synced transcript)
4. Quiz engine (all question types, end-of-quiz celebration)
5. Progress, XP, streaks, guest mode + auth merge, SRS review
6. Admin: entries, audio upload/record/trim, speakers
7. Admin: lesson/quiz builder with preview, map editor, draft/publish
8. Contribute page + submissions queue, culture section, about page
9. PWA/offline, performance, accessibility, polish

**Current phase:** 7 (phases 1–6 done)

## Don'ts
- Don't hardcode content, colors, or UI strings.
- Don't publish audio from a speaker without recorded consent.
- Don't add hearts/lives or punishing mechanics — mistakes are repeated, never penalized.
- Don't commit secrets; use `.env.local` and keep `.env.example` updated.