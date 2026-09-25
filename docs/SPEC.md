# Project: Tachawit — a gamified web app to learn Chaoui (Tachawit / Aurès Tamazight)

## Context
Tachawit is the Amazigh language of the Chaoui people of the Aurès mountains in northeastern Algeria (Batna, Khenchela, Oum El Bouaghi, Tébessa, Biskra). It is mainly an oral language with little learning material online. This app teaches it through native-speaker audio, a gamified level map, and short quizzes. Audio is recorded with native speakers from across the Aurès — Batna, Khenchela, Oum El Bouaghi, Tébessa and Biskra — not limited to any single town, and dialect variation across them is shown, not treated as an error. The tone is proud, warm and cultural: "Reclaim your language."

Build it in the phases listed at the end, one phase per request. After each phase, stop and summarize what was built and what's next.

## Tech stack
- Next.js (App Router) + TypeScript, deployed on Vercel
- Tailwind CSS + shadcn/ui as the base components
- Framer Motion for UI animation; Lottie or Rive for character/celebration animations
- Supabase (Postgres): Auth (email magic link + Google), Storage (audio and images), Row Level Security
- next-intl for UI translations: English, French, Modern Standard Arabic. Arabic is RTL, so the layout must flip correctly.
- PWA: installable, with lessons the user has opened cached for offline use

## Core principle: all content is data, never code
Every lesson, quiz, word, audio clip, map node and culture note lives in the database and is managed from the admin panel. Adding content must never require editing code or redeploying.

## Data model (adapt as needed, but keep these concepts)
- **units**: title (multilingual), description, order, map theme/region, cover illustration, status (draft/published)
- **levels** (nodes on the map): belongs to a unit, order, type (lesson / quiz / review / boss / story), unlock rule (default: previous level completed), map position (x, y)
- **entries** (a word or phrase): text_latin, text_arabic, text_tifinagh, translations (en, fr, ar), part of speech, dialect/region tag, notes, image (optional)
- **audio_clips**: file, linked entry, speaker (linked), duration, slow version (optional), transcript with word-level timestamps (optional)
- **speakers**: one per user account; name or pseudonym, region/village, consent given (boolean + date set when given), public bio (optional)
- **lessons**: ordered list of steps. Step types: introduce entry (audio + text + image), listen and repeat, culture note, dialogue (multiple speakers, line by line)
- **quizzes**: ordered list of questions. Question types:
  1. listen → pick the correct translation
  2. read translation → pick the correct audio
  3. listen → build the sentence from word tiles
  4. match pairs (audio ↔ meaning)
  5. fill in the missing word
  6. speak (optional, record yourself and compare by listening back; no automatic scoring in v1)
- **user_progress**: completed levels, stars (0–3), XP, streak, and per-entry spaced-repetition data (ease, interval, due date)
- **submissions**: suggestions from the public (a word, a regional variation, a correction, optional audio) waiting for admin review
- **culture_notes**: title, rich text body, images, linked unit

## Learner experience

### Script toggle
A global toggle for Latin / Arabic / Tifinagh. Every piece of Tachawit text renders in the chosen script. Missing scripts fall back to Latin gracefully.

### The map (home screen, the centerpiece)
- An illustrated, scrollable journey through the Aurès: mountains, cedar forests, cliffside villages like Ghoufi, palm groves toward Biskra. Each unit is a region of the map.
- Levels are nodes connected by a winding path. States: locked (greyed, subtle lock), available (gently pulsing), completed (1–3 stars), current (glowing, with a small avatar standing on it).
- When a level is completed, animate: stars fly into the node, the path to the next node draws itself, and the next node unlocks with a burst.
- Parallax layers on scroll (sky, far mountains, near terrain).
- On mobile, the map scrolls vertically; on desktop it can be wider.
- Node positions come from the database (set by drag-and-drop in the admin), never hardcoded.

### Lessons
- One card at a time, full-screen on mobile, with smooth card transitions.
- Audio is the star: a large play button, animated waveform while playing, a slow-speed button, and the transcript highlighting word by word in sync with the audio (karaoke style) when timestamps exist.
- Tap any word to hear it alone and see its meaning.
- Progress bar at the top.

### Quizzes
- Instant feedback: correct = satisfying animation + sound; wrong = gentle shake, then show and play the right answer.
- No hearts. Mistakes are never punished, only repeated at the end.
- End screen: stars earned, XP gained, words learned, with a celebration animation.

### Review
A daily review session built from spaced-repetition data, mixing quiz types with words that are due.

### Profile
XP, streak, words learned, units completed. Guest mode stores progress locally; signing up merges it into the account.

### Other pages
- Culture section (music, jewelry, history, Yennayer, food) as beautifully laid out articles
- "Contribute" page: submit a word, regional variation, or recording (with browser mic recording), goes to the admin review queue
- About page: the project's story and credits to speakers

## Visual design
- Identity rooted in Aurès and Amazigh visual culture: geometric motifs inspired by Chaoui weaving, pottery and silver jewelry; the Tifinagh ⵣ as a recurring mark.
- Palette: earthy terracotta, ochre, deep indigo, cedar green, silver accents. Warm off-white background in light mode; deep indigo night-sky in dark mode. Support both.
- Typography: a characterful display font for headings and a clean, highly readable font for body text, with proper support for Tamazight Latin characters (ɣ ḥ ṭ ḍ ṣ ẓ ε č ǧ), Arabic, and Tifinagh (e.g. Noto Sans Tifinagh).
- Animation should feel crafted and alive but never slow down learning: page transitions, staggered list entrances, hover and press micro-interactions, animated illustrations on the map, celebrations on milestones. Respect prefers-reduced-motion.
- Must look polished on a mid-range Android phone first, then scale up to desktop.
- Accessibility: good contrast, keyboard navigation, visible focus, aria labels on audio controls.

## Admin panel (/admin)
Only accessible to users with the admin role (enforced by Supabase RLS, not just the UI). It must be simple enough for a non-developer.

- **Dashboard**: counts of content, pending submissions, basic learner stats
- **Entries**: create/edit words and phrases in all three scripts and four translations; attach audio; tag dialect/region. Bulk import from CSV.
- **Audio**: drag-and-drop upload (mp3, m4a, wav, webm) OR record directly in the browser; waveform preview; trim start/end; auto-convert to a web-friendly format; link to an entry and a speaker. Optional word-timestamp editor: place cuts on the waveform where each word starts and ends (a first guess comes from the pauses), then check with playback.
- **Lessons & quizzes**: visual builder. Add steps/questions from a menu, reorder by drag-and-drop, pick entries from a searchable list, live preview exactly as the learner will see it.
- **Map editor**: drag level nodes to place them on the map, reorder levels, assign them to units.
- **Draft / publish**: nothing appears to learners until published. Preview drafts before publishing.
- **Submissions queue**: listen, approve (convert to entry), edit, or reject.
- **Speakers**: see who has offered their voice and their consent. Speakers are user accounts: any user becomes a speaker and gives or withdraws consent from their own profile; admins cannot create speakers.
- **Culture notes**: rich text editor with images.

## Quality requirements
- Type-safe Supabase queries; content fetched with caching so the app is fast
- Audio files lazy-loaded and preloaded one step ahead in lessons
- Seed the database with sample content: one unit ("First Words & Greetings") with 3 lessons and 1 quiz, using placeholder audio, so everything can be tested immediately
- Clear README: setup, environment variables, how to create the first admin user
- Tests first: write the tests for each phase before the implementation.

## Build phases (one per request)
1. Project setup, design system (colors, fonts, motifs, components), i18n with RTL, script toggle, Supabase schema + RLS + seed data
2. The map with all node states and unlock animations
3. Lesson player with audio, waveform, slow mode, synced transcript
4. Quiz engine with all question types and end-of-quiz celebration
5. Progress, XP, streaks, guest mode + auth, spaced-repetition review
6. Admin panel: entries, audio upload/record/trim, speakers
7. Admin panel: lesson/quiz builder with preview, map editor, draft/publish
8. Contribute page + submissions queue, culture section, about page
9. PWA/offline, performance pass, accessibility pass, final polish
