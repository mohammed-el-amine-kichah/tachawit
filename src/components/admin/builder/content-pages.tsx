import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { localize } from "@/i18n/localize";
import { Link } from "@/i18n/navigation";
import { referencedEntryIds, type DraftItem } from "@/lib/admin/builder";
import { getContent, listContent, listCultureNoteOptions, listUnits, type ContentKind } from "@/lib/admin/queries";
import { localizedTextSchema } from "@/lib/content/localized-text";
import type { EntryRow } from "@/lib/lesson/view";
import { ENTRY_WITH_AUDIO } from "@/lib/supabase/queries/entry-select";
import { createServerSupabase } from "@/lib/supabase/server";
import { toLocalizedForm } from "../localized-form";
import { PageHeader } from "../page-header";
import { StatusBadge } from "../status-badge";
import { ContentBuilder } from "./content-builder";
import { NewContentButton } from "./new-content-button";

/** Lessons or quizzes, newest first. */
export async function ContentListPage({ kind }: { kind: ContentKind }) {
  const t = await getTranslations("Admin.builder");
  const locale = await getLocale();
  const items = await listContent(kind);
  const base = kind === "lesson" ? "/admin/lessons" : "/admin/quizzes";
  return (
    <>
      <PageHeader title={t(kind === "lesson" ? "lessonsTitle" : "quizzesTitle")} description={t(kind === "lesson" ? "lessonsLead" : "quizzesLead")} actions={<NewContentButton kind={kind} />} />
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-muted-foreground">{t("emptyList")}</p>
      ) : (
        <ul className="divide-y rounded-xl bg-card ring-1 ring-border">
          {items.map((item) => {
            const title = localizedTextSchema.safeParse(item.title);
            return (
              <li key={item.id}>
                <Link href={`${base}/${item.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/50">
                  <span className="min-w-0 flex-1 font-medium">{title.success ? localize(title.data, locale)?.text : item.id}</span>
                  <span className="text-sm text-muted-foreground">{t(kind === "lesson" ? "stepCount" : "questionCount", { count: item.count })}</span>
                  <span className="text-sm text-muted-foreground">{t("usedBy", { count: item.usedBy })}</span>
                  <StatusBadge status={item.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** The builder for one lesson or quiz. */
export async function ContentEditPage({ kind, id }: { kind: ContentKind; id: string }) {
  if (!z.uuid().safeParse(id).success) notFound();
  const t = await getTranslations("Admin.builder");
  const nav = await getTranslations("Admin.nav");
  const tm = await getTranslations("Admin.map");
  const locale = await getLocale();
  const [content, notes, units] = await Promise.all([getContent(kind, id), listCultureNoteOptions(), listUnits()]);
  if (!content) notFound();
  const items = z.array(z.looseObject({ id: z.string(), type: z.string() })).catch([]).parse(content.items) as DraftItem[];
  const entryIds = referencedEntryIds(items);
  const supabase = await createServerSupabase();
  const { data: rows } = entryIds.length
    ? await supabase.from("entries").select(ENTRY_WITH_AUDIO).in("id", entryIds).returns<EntryRow[]>()
    : { data: [] as EntryRow[] };
  const title = localizedTextSchema.safeParse(content.title);
  const textOf = (value: unknown) => {
    const parsed = localizedTextSchema.safeParse(value);
    return parsed.success ? (localize(parsed.data, locale)?.text ?? null) : null;
  };
  const mapLevels = content.levels.map((level) => ({
    id: level.id,
    unitId: level.unit_id,
    label: `${textOf(level.units?.title) ?? ""} › ${textOf(level.title) ?? tm("levelNumber", { number: level.position + 1 })}`,
  }));

  return (
    <>
      <PageHeader
        title={(title.success ? localize(title.data, locale)?.text : null) ?? t(kind === "lesson" ? "newLesson" : "newQuiz")}
        description={t("editLead")}
        back={{ href: kind === "lesson" ? "/admin/lessons" : "/admin/quizzes", label: nav(kind === "lesson" ? "lessons" : "quizzes") }}
      />
      <ContentBuilder
        key={content.id}
        kind={kind}
        content={{ id: content.id, status: content.status, title: toLocalizedForm(title.success ? title.data : null), items }}
        initialRows={rows ?? []}
        notes={notes}
        mapLevels={mapLevels}
        units={units.map((u) => ({ id: u.id, title: textOf(u.title) ?? u.slug }))}
      />
    </>
  );
}
