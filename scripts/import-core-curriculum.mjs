// Imports the core curriculum (content/core-curriculum/*.json) into Supabase as drafts.
//
//   pnpm content:import:local                                  local Supabase (pnpm db:start)
//   pnpm content:import:production --confirm <project-ref>     the linked Supabase project
//   node scripts/import-core-curriculum.mjs --print            print the SQL without running it
//
// Idempotent: rows are inserted with `on conflict (id) do nothing`, so anything that already exists,
// including every edit reviewers made in /admin, is left untouched. Rows reviewers deleted come back
// as drafts if it is run again. No status is set: everything arrives as a draft, in one statement
// (a single DO block), so an error leaves the database unchanged.

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const contentDir = join(root, "content", "core-curriculum");

const args = process.argv.slice(2);
const mode = args.includes("--print") ? "print" : args.includes("--production") ? "production" : args.includes("--local") ? "local" : null;

if (!mode) {
  console.error("Choose a target: --local, --production --confirm <project-ref>, or --print.");
  process.exit(1);
}

const files = readdirSync(contentDir)
  .filter((name) => name.endsWith(".json"))
  .sort()
  .map((name) => JSON.parse(readFileSync(join(contentDir, name), "utf8")));

const text = (value) => (value === null || value === undefined ? "null" : `'${String(value).replaceAll("'", "''")}'`);
const json = (value) => `${text(JSON.stringify(value))}::jsonb`;
const uuid = (value) => (value === null ? "null" : `${text(value)}::uuid`);
const cast = (value, type) => `${text(value)}::public.${type}`;

function insert(table, columns, rows) {
  if (rows.length === 0) return "";
  return [
    `insert into public.${table} (${columns.join(", ")}) values`,
    rows.map((row) => `  (${row.join(", ")})`).join(",\n"),
    "on conflict (id) do nothing;",
  ].join("\n");
}

const entries = files.flatMap((file) => file.entries);
const lessons = files.flatMap((file) => file.lessons);
const quizzes = files.flatMap((file) => file.quizzes);
const levels = files.flatMap((file) => file.levels.map((level) => ({ ...level, unit_id: file.unit.id })));
const idList = (rows) => rows.map((row) => text(row.id)).join(", ");

// Dependency order: entries → lessons/quizzes → units → levels. Units take the next free map
// positions after whatever the database already has, in file order.
const statements = [
  insert(
    "entries",
    ["id", "text_latin", "text_arabic", "text_tifinagh", "translations", "part_of_speech", "region_id"],
    entries.map((e) => [
      uuid(e.id), text(e.text_latin), text(e.text_arabic), text(e.text_tifinagh), json(e.translations),
      cast(e.part_of_speech, "part_of_speech"), uuid(e.region_id),
    ]),
  ),
  insert("lessons", ["id", "title", "steps"], lessons.map((l) => [uuid(l.id), json(l.title), json(l.steps)])),
  insert("quizzes", ["id", "title", "questions"], quizzes.map((q) => [uuid(q.id), json(q.title), json(q.questions)])),
  ...files.map(({ unit }) =>
    [
      "insert into public.units (id, slug, position, title, description, map_theme)",
      `select ${uuid(unit.id)}, ${text(unit.slug)}, coalesce(max(position) + 1, 0), ${json(unit.title)}, ${json(unit.description)}, ${cast(unit.map_theme, "map_theme")}`,
      "from public.units",
      "on conflict (id) do nothing;",
    ].join("\n"),
  ),
  insert(
    "levels",
    ["id", "unit_id", "position", "type", "title", "lesson_id", "quiz_id", "map_x", "map_y"],
    levels.map((l) => [
      uuid(l.id), uuid(l.unit_id), String(l.position), cast(l.type, "level_type"), json(l.title), uuid(l.lesson_id), uuid(l.quiz_id),
      String(l.map_x), String(l.map_y),
    ]),
  ),
];
const sql = `do $import$\nbegin\n${statements.filter(Boolean).join("\n\n")}\nend\n$import$;`;

const summary = [
  "select",
  `  (select count(*) from public.units where id in (${idList(files.map((file) => file.unit))})) as units,`,
  `  (select count(*) from public.levels where id in (${idList(levels)})) as levels,`,
  `  (select count(*) from public.lessons where id in (${idList(lessons)})) as lessons,`,
  `  (select count(*) from public.quizzes where id in (${idList(quizzes)})) as quizzes,`,
  `  (select count(*) from public.entries where id in (${idList(entries)})) as entries;`,
].join("\n");

if (mode === "print") {
  console.log(`${sql}\n\n${summary}`);
  process.exit(0);
}

let target = ["--local"];
if (mode === "production") {
  const refFile = join(root, "supabase", ".temp", "project-ref");
  const linked = existsSync(refFile) ? readFileSync(refFile, "utf8").trim() : "";
  const confirmed = args[args.indexOf("--confirm") + 1];
  if (!linked) {
    console.error("No linked project. Run `pnpm exec supabase link --project-ref <project-ref>` first.");
    process.exit(1);
  }
  if (!args.includes("--confirm") || confirmed !== linked) {
    console.error(`This writes to the linked Supabase project "${linked}". Re-run with --confirm ${linked} to go ahead.`);
    process.exit(1);
  }
  target = ["--linked"];
}

console.log(
  `Importing ${files.length} units, ${levels.length} levels, ${lessons.length} lessons, ${quizzes.length} quizzes and ${entries.length} entries as drafts (${mode})…`,
);
const dir = mkdtempSync(join(tmpdir(), "tachawit-curriculum-"));
const run = (name, query) => {
  const file = join(dir, name);
  writeFileSync(file, query);
  return spawnSync("pnpm", ["exec", "supabase", "db", "query", ...target, "-f", file], { cwd: root, stdio: "inherit" }).status ?? 1;
};
const status = run("import.sql", sql) || run("summary.sql", summary);
rmSync(dir, { recursive: true, force: true });
if (status === 0) console.log("Done. The rows above are the curriculum rows now in the database (new and already present).");
process.exit(status);
