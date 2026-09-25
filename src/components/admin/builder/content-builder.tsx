"use client";

import { CheckIcon, EyeIcon, LoaderIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteContent, saveContent, setContentStatus } from "@/app/actions/admin/content";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { localize } from "@/i18n/localize";
import { getPathname, Link } from "@/i18n/navigation";
import { blankQuestion, blankStep, itemIssues, nextId, referencedEntryIds, type DraftItem } from "@/lib/admin/builder";
import type { LessonStepType } from "@/lib/content/lesson";
import { localizedTextSchema } from "@/lib/content/localized-text";
import type { QuizQuestionType } from "@/lib/content/quiz";
import type { CultureNoteRow, EntryRow } from "@/lib/lesson/view";
import { ConfirmButton } from "../confirm-button";
import { LocalizedFields, type LocalizedFormValue } from "../localized-fields";
import { PublishChecklist } from "../publish/publish-checklist";
import { ReadinessBanner } from "../publish/readiness-banner";
import { useReadiness } from "../publish/use-readiness";
import { StatusBadge } from "../status-badge";
import { BuilderPreview } from "./builder-preview";
import { ItemList } from "./item-list";
import { MapLinks, type MapLevel, type UnitOption } from "./map-links";
import { QuestionEditor } from "./question-editor";
import { StepEditor } from "./step-editor";
import { useEntryRows } from "./use-entry-rows";

const STEP_TYPES: LessonStepType[] = ["introduce", "listen_repeat", "dialogue", "culture_note"];
const QUESTION_TYPES: QuizQuestionType[] = ["listen_pick_translation", "pick_audio", "build_sentence", "match_pairs", "fill_blank", "speak"];

/**
 * Visual builder for a lesson or a quiz: add steps or questions from a menu, reorder them,
 * pick entries, and see each one exactly as learners will. Drafts save themselves; a published
 * lesson or quiz only saves when complete, so learners never meet a broken one.
 */
export function ContentBuilder({
  kind,
  content,
  initialRows,
  notes,
  mapLevels,
  units,
}: {
  kind: "lesson" | "quiz";
  content: { id: string; title: LocalizedFormValue; status: "draft" | "published"; items: DraftItem[] };
  initialRows: EntryRow[];
  notes: CultureNoteRow[];
  mapLevels: MapLevel[];
  units: UnitOption[];
}) {
  const t = useTranslations("Admin.builder");
  const e = useTranslations("Admin.errors");
  const types = useTranslations(kind === "lesson" ? "Admin.stepTypes" : "Admin.questionTypes");
  const locale = useLocale();
  const router = useRouter();
  const [title, setTitle] = useState(content.title);
  const [items, setItems] = useState(content.items);
  const [selectedId, setSelectedId] = useState<string | null>(content.items[0]?.id ?? null);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify({ title: content.title, items: content.items }));
  const [saving, startSaving] = useTransition();
  const [changing, startChanging] = useTransition();
  const { rows, ensure } = useEntryRows(initialRows);
  const draft = content.status === "draft";
  const currentJson = JSON.stringify({ title, items });
  const dirty = currentJson !== savedJson;
  const issues = useMemo(() => itemIssues(kind, items), [kind, items]);
  const complete = items.length > 0 && Object.keys(issues).length === 0;
  const latest = useRef({ title, items });
  const selected = items.find((i) => i.id === selectedId) ?? null;
  const readiness = useReadiness(kind, content.id, `${content.status}:${savedJson}:${mapLevels.map((l) => l.id).join()}`);
  const [checklistOpen, setChecklistOpen] = useState(false);

  useEffect(() => {
    latest.current = { title, items };
  }, [title, items]);

  useEffect(() => {
    void ensure(referencedEntryIds(items));
  }, [items, ensure]);

  const save = (quiet: boolean) => {
    const snapshot = latest.current;
    startSaving(async () => {
      const result = await saveContent(kind, content.id, snapshot);
      if (!result.ok) {
        if (!quiet) toast.error(result.error === "invalid" && !draft ? t("completeFirst") : e(result.error));
        return;
      }
      setSavedJson(JSON.stringify(snapshot));
      if (!quiet) toast.success(t("saved"));
    });
  };

  // Drafts save themselves shortly after each change.
  useEffect(() => {
    if (!draft || !dirty) return;
    const timer = setTimeout(() => save(true), 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save reads the latest values through a ref
  }, [currentJson, draft, dirty]);

  // Saves first, so the checklist describes exactly what is on screen.
  const openChecklist = () =>
    startChanging(async () => {
      if (dirty) {
        const saved = await saveContent(kind, content.id, latest.current);
        if (!saved.ok) return void toast.error(saved.error === "invalid" && !draft ? t("completeFirst") : e(saved.error));
        setSavedJson(JSON.stringify(latest.current));
      }
      if (await readiness.reload()) setChecklistOpen(true);
    });

  const unpublish = () =>
    startChanging(async () => {
      if (dirty) {
        const saved = await saveContent(kind, content.id, latest.current);
        if (!saved.ok) return void toast.error(e(saved.error));
        setSavedJson(JSON.stringify(latest.current));
      }
      const result = await setContentStatus(kind, content.id, "draft");
      if (!result.ok) return void toast.error(e(result.error));
      toast.success(t("unpublished"));
      router.refresh();
    });

  const add = (type: string) => {
    const id = nextId(items, kind === "lesson" ? "s" : "q");
    const item = kind === "lesson" ? blankStep(type as LessonStepType, id) : blankQuestion(type as QuizQuestionType, id);
    setItems([...items, item]);
    setSelectedId(id);
  };

  const summaryOf = (item: DraftItem): string => {
    const text = (id: unknown) => (typeof id === "string" && rows[id] ? rows[id].text_latin : "");
    if (item.type === "culture_note") {
      const own = localizedTextSchema.safeParse(item.title);
      if (own.success) return localize(own.data, locale)?.text ?? "";
      const note = notes.find((n) => n.id === item.cultureNoteId);
      const noteTitle = note ? localizedTextSchema.safeParse(note.title) : null;
      return noteTitle?.success ? (localize(noteTitle.data, locale)?.text ?? "") : "";
    }
    if (Array.isArray(item.lines)) return (item.lines as { entryId: string }[]).map((l) => text(l.entryId)).filter(Boolean).join(" / ");
    if (Array.isArray(item.entryIds)) return (item.entryIds as string[]).map(text).filter(Boolean).join(", ");
    return text(item.entryId);
  };

  const types_ = kind === "lesson" ? STEP_TYPES : QUESTION_TYPES;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/60 px-4 py-3">
        <StatusBadge status={content.status} />
        <span aria-live="polite" className="flex items-center gap-1 text-sm text-muted-foreground">
          {saving ? (
            <>
              <LoaderIcon aria-hidden className="size-4 animate-spin" /> {t("saving")}
            </>
          ) : !dirty ? (
            <>
              <CheckIcon aria-hidden className="size-4" /> {t("allSaved")}
            </>
          ) : draft ? (
            t("autosaving")
          ) : (
            t("unsaved")
          )}
        </span>
        {!complete && <span className="text-sm text-destructive">{t("incomplete", { count: Object.keys(issues).length || 1 })}</span>}
        <div className="ms-auto flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/preview/${kind}/${content.id}`} target="_blank">
              <EyeIcon aria-hidden />
              {t("fullPreview")}
            </Link>
          </Button>
          {!draft && (
            <Button type="button" onClick={() => save(false)} disabled={saving || !dirty}>
              {t("saveChanges")}
            </Button>
          )}
          {draft ? (
            <Button type="button" onClick={openChecklist} disabled={changing || !complete} className="bg-success text-success-foreground hover:bg-success/90">
              {t("publish")}
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={unpublish} disabled={changing}>
              {t("unpublish")}
            </Button>
          )}
          <ConfirmButton
            trigger={
              <Button type="button" variant="ghost" size="icon" aria-label={t("delete")} disabled={changing}>
                <Trash2Icon aria-hidden />
              </Button>
            }
            title={t("deleteTitle")}
            description={t("deleteLead")}
            confirmLabel={t("delete")}
            onConfirm={() =>
              startChanging(async () => {
                const result = await deleteContent(kind, content.id);
                if (!result.ok) return void toast.error(e(result.error));
                router.push(getPathname({ href: kind === "lesson" ? "/admin/lessons" : "/admin/quizzes", locale }));
              })
            }
          />
        </div>
      </div>

      {readiness.state && <ReadinessBanner state={readiness.state} onReview={openChecklist} />}
      <MapLinks kind={kind} contentId={content.id} levels={mapLevels} units={units} />
      <PublishChecklist kind={kind} contentId={content.id} input={readiness.input} open={checklistOpen} onOpenChange={setChecklistOpen} />

      <LocalizedFields id="title" label={t("title")} required value={title} onChange={setTitle} />

      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)_22rem]">
        <section aria-label={t(kind === "lesson" ? "steps" : "questions")} className="flex flex-col gap-3">
          <ItemList
            items={items}
            selectedId={selectedId}
            issues={issues}
            labelOf={(item) => types(item.type as never)}
            summaryOf={summaryOf}
            onReorder={setItems}
            onSelect={setSelectedId}
            onRemove={(id) => {
              setItems(items.filter((i) => i.id !== id));
              if (selectedId === id) setSelectedId(null);
            }}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline">
                <PlusIcon aria-hidden />
                {t(kind === "lesson" ? "addStep" : "addQuestion")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {types_.map((type) => (
                <DropdownMenuItem key={type} onSelect={() => add(type)}>
                  {types(type as never)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </section>

        <section aria-label={t("editor")} className="rounded-2xl bg-card p-5 ring-1 ring-border">
          {selected ? (
            <div className="flex flex-col gap-4">
              <h2 className="font-sans text-lg font-semibold">{types(selected.type as never)}</h2>
              {issues[selected.id] && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{t(`issues.${issues[selected.id]}`)}</p>}
              {kind === "lesson" ? (
                <StepEditor step={selected} rows={rows} notes={notes} onChange={(next) => setItems(items.map((i) => (i.id === next.id ? next : i)))} />
              ) : (
                <QuestionEditor question={selected} rows={rows} onChange={(next) => setItems(items.map((i) => (i.id === next.id ? next : i)))} />
              )}
            </div>
          ) : (
            <p className="py-10 text-center text-muted-foreground">{t(items.length ? "selectItem" : "emptyItems")}</p>
          )}
        </section>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <BuilderPreview kind={kind} item={selected} rows={rows} notes={notes} />
        </aside>
      </div>
    </div>
  );
}
