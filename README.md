# Tachawit

A gamified web app to learn **Tachawit** (Chaoui, the Amazigh language of the Aurès) through native-speaker audio, an illustrated level map and short quizzes. *Reclaim your language.*

- Product spec: [docs/SPEC.md](docs/SPEC.md)
- Conventions for contributors and AI agents: [CLAUDE.md](CLAUDE.md)

**Status:** phase 1 of 9 (foundations: design system, i18n with RTL, script toggle, database schema with row-level security, seed data).

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
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | shell env when running `pnpm db:start` | Optional: Google sign-in for local Supabase |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` | shell env when running `pnpm db:start` | Optional: Google sign-in for local Supabase |

Never commit `.env.local`. Keep `.env.example` up to date when adding variables.

## Creating the first admin user

Admin rights live in `public.profiles.role` and are enforced by row-level security. Hiding the admin UI is not what protects it. A user cannot promote themselves through the API. The first admin is promoted with SQL, which only someone with database access can run.

1. **Create the account.** Until the sign-in screen ships (phase 5), create the user in Supabase Studio: *Authentication → Users → Add user* (local: http://127.0.0.1:54323; hosted: your project dashboard). Signing up creates a `learner` profile automatically.
2. **Promote it** in the Studio *SQL Editor*:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

After that, admins can promote other users from the admin panel (phase 6).

## Deploying

1. Create a Supabase project, then link and push the schema:
   ```bash
   pnpm exec supabase link --project-ref <your-project-ref>
   pnpm exec supabase db push     # migrations only; the placeholder seed is not pushed
   ```
2. In the Supabase dashboard, under *Authentication*, set the site URL and redirect URLs to your domain, and enable the Google provider if you want it.
3. Import the repo into Vercel and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Tests

```bash
pnpm test        # Vitest: pure logic, Zod content contracts, message catalogs,
                 # plus an integration test of published content (runs when .env.local points at a live Supabase)
pnpm test:db     # pgTAP: schema, RLS for guests/learners/admins, consent and publish guards, storage, seed
pnpm lint && pnpm typecheck && pnpm build
```

## How content works

All learning content (units, map levels, words, audio, lessons, quizzes, culture notes) lives in the database and is managed from `/admin`. Nothing learners see is hardcoded.

- Everything publishable is `draft` or `published`; learners (and the public API) only ever see `published`.
- The database refuses to publish something that points at a draft: a lesson using a draft word, or a level whose lesson is a draft.
- Audio can only be published for a speaker with recorded consent. Revoking consent unpublishes their audio.
- Lesson steps and quiz questions are typed JSON, validated by the Zod schemas in `src/lib/content/`, shared by the admin and learner sides.

### Seed content is placeholder

`supabase/seed.sql` holds one unit ("First Words & Greetings") with 3 lessons and 1 quiz so every feature can be tried. **Every word is marked `[PLACEHOLDER]`**: common pan-Amazigh forms chosen only to exercise the app. The audio is synthetic tones, not pronunciation. All of it must be replaced by spellings and recordings verified with native speakers from Merouana.

## Languages and scripts

- UI languages: Modern Standard Arabic (`/ar`, the default), Algerian Darja (`/dz`), French (`/fr`) and English (`/en`). Arabic and Darja are right-to-left.
  Darja's internal locale is `ar-DZ` because `dz` is the ISO code for Dzongkha, and using it makes numbers and plurals format incorrectly. The URL stays `/dz`, and content keys and the message file stay `dz`.
- Tachawit text can be shown in Latin, Arabic or Tifinagh script (toggle in the header, remembered in a cookie). A missing script falls back to Latin. Always render Tachawit through `<TachawitText>`.
