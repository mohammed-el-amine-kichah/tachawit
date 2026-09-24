# Tachawit

A gamified web app to learn **Tachawit** (Chaoui, the Amazigh language of the Aurès) through native-speaker audio, an illustrated level map and short quizzes. *Reclaim your language.*

- Product spec: [docs/SPEC.md](docs/SPEC.md)
- Conventions for contributors and AI agents: [CLAUDE.md](CLAUDE.md)

**Status:** all 9 phases done: foundations, the map, lessons, quizzes, progress with accounts and review, the full admin panel (content, audio, builders, map editor), contributions, culture and about pages, and an installable app that works offline. The learning content is placeholder until native speakers provide and verify it (see [Seed content is placeholder](#seed-content-is-placeholder)).

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS 4 · shadcn/ui (Radix, RTL mode) · Motion · next-intl · Supabase (Postgres, Auth, Storage, RLS) · Zod · Vitest · pgTAP

## Prerequisites

- Node.js 20.9 or newer, and [pnpm](https://pnpm.io)
- Docker for the local Supabase stack. Docker Desktop, [OrbStack](https://orbstack.dev) or [Colima](https://github.com/abiosoft/colima) (`colima start`) all work.

The Supabase CLI is a dev dependency, so there's nothing else to install.

## Getting started

```bash
pnpm install
pnpm db:start                      # starts local Supabase, applies migrations, seeds sample content
pnpm exec supabase status -o env   # prints the local URL and keys
cp .env.example .env.local         # then paste API_URL and PUBLISHABLE_KEY into it
pnpm dev                           # http://localhost:3000
```

Local services:

| Service | URL |
|---|---|
| App | http://localhost:3000 (Arabic by default; a language picked in the switcher is remembered) |
| Supabase Studio | http://127.0.0.1:54323 |
| Mailpit (catches magic-link emails) | http://127.0.0.1:54324 |
| Design system page | http://localhost:3000/en/design |

After changing migrations, run `pnpm db:reset` (re-applies migrations and seed) and `pnpm db:types` (regenerates `src/lib/supabase/types.ts`).

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local`, Vercel | Supabase API URL (local: `http://127.0.0.1:54321`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env.local`, Vercel | Publishable (anon) key. Safe in the browser, since every table is protected by RLS |
| `NEXT_PUBLIC_SITE_URL` | Vercel | Public address of the site (e.g. `https://tachawit.app`), used in sign-in links. Optional locally |
| `SUBMISSION_HASH_SALT` | Vercel | Secret used to hash contributors' IP addresses for rate limiting (any long random string) |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | shell env when running `pnpm db:start` | Optional: Google sign-in for local Supabase |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` | shell env when running `pnpm db:start` | Optional: Google sign-in for local Supabase |

Never commit `.env.local`. Keep `.env.example` up to date when adding variables.

## Creating the first admin user

Admin rights live in `public.profiles.role` and are enforced by row-level security. Hiding the admin UI is not what protects it. A user cannot promote themselves through the API. The first admin is promoted with SQL, which only someone with database access can run.

1. **Create the account.** Sign in on the site (`/ar/login`) with a magic link or Google. Locally, the email lands in Mailpit (http://127.0.0.1:54324). Signing up creates a `learner` profile automatically.
2. **Promote it** in the Studio *SQL Editor*:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

After that, admins can promote other people from *Admin → People* (`/ar/admin/users`).

## Admin panel

`/ar/admin` (or any locale). Admins only: the page checks the role on the server and row-level security enforces it in the database.

- **Words & phrases:** search, filter, create and edit in Latin, Arabic script and Tifinagh (with a Tifinagh suggestion from the Latin spelling), four translations, part of speech, region, image and notes. Drafts save automatically; publishing is explicit. A live preview shows the entry exactly as learners see it. Bulk import from CSV (every row becomes a draft).
- **Audio:** drag and drop a file (MP3, M4A, WAV, WebM, OGG) or record in the browser, trim it, pick the speaker. The server converts it with ffmpeg into mono AAC plus a slow version, keeps the original privately, and creates a draft clip. Word timings are set by tapping along while the clip plays.
- **Speakers:** name or pseudonym, region, village and consent (with its date). Audio from a speaker without consent cannot be published, and revoking consent unpublishes their audio (enforced by the database).
- **Lessons & quizzes:** visual builders. Add steps or questions from a menu, reorder them by dragging (or with the arrow buttons), pick words from a searchable list, and see each one live exactly as learners will. A full-screen preview plays the draft; nothing is recorded. Drafts save themselves; publishing checks that everything is complete.
- **Map & units:** drag levels on the unit's scenery (or use the arrow keys), arrange them evenly, set each level's type, lesson or quiz, and unlock rule, reorder levels and units, and publish. Learners see a level only when the level, its lesson or quiz, and its unit are all published.
- **Submissions:** listen to contributed recordings, edit, then approve (creating draft entries, or a draft clip from a speaker created with the consent the contributor gave) or reject.
- **Culture:** articles in Markdown per language, with a formatting toolbar, image upload and preview.
- **Regions** and **People** (promote or demote admins).

## Contributions and culture

- `/contribute`: anyone can suggest a word, a local variant, a correction, or a recording (microphone or file, with explicit consent to publish). A hidden field catches bots, and each sender is limited to 10 submissions per hour, keyed on a salted hash of their IP address (never the address itself). Everything waits for review.
- `/culture`: articles about music, silver jewelry, history, Yennayer and food. Bodies use a small Markdown subset rendered as React elements (no raw HTML), so article content can't inject scripts.
- `/about`: the story of the project and credits to every speaker who gave consent.

## Accounts and progress

- Guests learn without an account; progress is kept in the browser (localStorage).
- Signing in with a magic link or Google merges that guest progress into the account (`merge_guest_progress`).
- Signed-in progress is written through database functions (`complete_level`, `log_activity`) that run with the learner's own permissions, so row-level security still applies. Writes wait in a local outbox and are retried when the connection returns.
- Streaks count the learner's local calendar days; spaced repetition follows SM-2. Both are unit-tested (`src/lib/progress`, `src/lib/srs`).

## Offline and installing

Tachawit installs as an app (web app manifest, icons in `public/icons`) and keeps working offline through a small hand-written service worker, `public/sw.js`. It only runs in production builds (`pnpm build && pnpm start`), since it would get in the way of hot reloading.

- **What is kept:** the map, every level a learner opens (the page and all of its audio, slow versions included), the review page, and an offline page in each language. Build assets are cached as they are used.
- **How pages load:** from the network first; if the connection is down, or takes more than four seconds, the kept copy is used. Pages never opened show the offline page. Admin, sign-in and API requests are never cached.
- **Progress offline:** guests keep progress on the device anyway; signed-in learners' progress waits in the outbox and syncs when the connection returns. Review needs a connection to load its words.
- **Signing out** clears kept pages, since they show the account in the header.
- **After changing** `public/sw.js`, bump `VERSION` at the top if the static cache should be emptied. The worker is served with `Cache-Control: no-store`, so browsers pick up changes on the next visit.

## Security

- Row-level security on every table (tested with pgTAP); admin screens are also guarded on the server, but the database is the real boundary.
- A strict Content-Security-Policy with a per-request nonce (`src/proxy.ts`, `src/lib/security/csp.ts`): scripts must carry the nonce; audio, images and API calls may only reach this site and Supabase.
- Other headers in `next.config.ts`: `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy, HSTS, and a permissions policy that allows only the microphone (for recordings).
- Contributions are rate-limited on a salted hash of the IP address; the address itself is never stored.

### Google sign-in

Create an OAuth client in Google Cloud (type *Web application*) with the redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`, then enable Google under *Authentication → Providers* in Supabase. For local Supabase, set `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`, set `enabled = true` under `[auth.external.google]` in `supabase/config.toml`, and restart Supabase.

## Deploying

1. Create a Supabase project, then link and push the schema:
   ```bash
   pnpm exec supabase link --project-ref <your-project-ref>
   pnpm exec supabase db push     # migrations only; the placeholder seed is not pushed
   ```
2. In the Supabase dashboard, under *Authentication → URL Configuration*, set the site URL to your domain and add `https://<your-domain>/api/auth/callback` to the redirect URLs. Enable Google if you want it (see above).
3. Import the repo into Vercel and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` (used for the sitemap, links in emails and social previews) and `SUBMISSION_HASH_SALT`.
4. Create the first admin (see above), then replace the placeholder content: add speakers with their recorded consent, entries and audio, and build lessons in the admin panel.
5. `sitemap.xml` and `robots.txt` are generated from the published content; submit the sitemap to search engines if you want the culture articles indexed.

## Tests

```bash
pnpm test        # Vitest: pure logic, Zod content contracts, message catalogs,
                 # plus an integration test of published content (runs when .env.local points at a live Supabase)
pnpm db:reset && pnpm test:db   # pgTAP on a fresh seed: schema, RLS, consent and publish guards, progress functions, storage, seed
pnpm lint && pnpm typecheck && pnpm build
```

## How content works

All learning content (units, map levels, words, audio, lessons, quizzes, culture notes) lives in the database and is managed from `/admin`. Nothing learners see is hardcoded.

- Everything publishable is `draft` or `published`; learners (and the public API) only ever see `published`.
- The database refuses to publish something that points at a draft: a lesson using a draft word, or a level whose lesson is a draft.
- Audio can only be published for a speaker with recorded consent. Revoking consent unpublishes their audio.
- Lesson steps and quiz questions are typed JSON, validated by the Zod schemas in `src/lib/content/`, shared by the admin and learner sides.

### Seed content is placeholder

`supabase/seed.sql` holds one unit ("First Words & Greetings") with 3 lessons and 1 quiz so every feature can be tried. **Every word is marked `[PLACEHOLDER]`**: common pan-Amazigh forms chosen only to exercise the app. The audio is synthetic tones, not pronunciation. All of it must be replaced by spellings and recordings verified with native speakers from across the Aurès (Batna, Khenchela, Oum El Bouaghi, Tébessa, Biskra).

## Languages and scripts

- UI languages: Modern Standard Arabic (`/ar`, the default), French (`/fr`) and English (`/en`). Arabic is right-to-left.
  Darja was dropped: old `/dz` links redirect to `/ar`, and a `dz` key left in older content is ignored.
- Tachawit text can be shown in Latin, Arabic or Tifinagh script (toggle in the header, remembered in a cookie). A missing script falls back to Latin. Always render Tachawit through `<TachawitText>`.
