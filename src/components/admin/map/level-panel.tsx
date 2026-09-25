"use client";

import { ArrowDownIcon, ArrowUpIcon, EyeIcon, EyeOffIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteLevel, moveLevel, saveLevel, setLevelStatus } from "@/app/actions/admin/map";
import { LevelIcon } from "@/components/map/level-icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { localize } from "@/i18n/localize";
import { Link } from "@/i18n/navigation";
import { levelBlockers } from "@/lib/admin/readiness";
import type { LevelFormInput } from "@/lib/admin/schemas";
import { levelTypes } from "@/lib/content/enums";
import type { LocalizedText } from "@/lib/content/localized-text";
import type { UnlockRule } from "@/lib/content/unlock-rule";
import type { LevelType } from "@/lib/supabase/queries/units";
import { cn } from "@/lib/utils";
import { ChoiceSelect } from "../choice-select";
import { ConfirmButton } from "../confirm-button";
import { LocalizedFields, toLocalizedForm } from "../localized-fields";
import { SaveIndicator } from "../save-indicator";
import { StatusBadge } from "../status-badge";
import { useAdminAction } from "../use-admin-action";
import { NewContentForLevel } from "./new-content-for-level";

export type PanelLevel = {
  id: string;
  type: LevelType;
  title: LocalizedText | null;
  lesson_id: string | null;
  quiz_id: string | null;
  unlockRule: UnlockRule;
  status: "draft" | "published";
};

type Option = { id: string; title: LocalizedText; status: "draft" | "published" };

const RULES = ["previous_completed", "always", "levels_completed", "unit_stars"] as const;

/** A level's settings. Changes save themselves a moment after the last edit, like every other editor. */
function LevelForm({
  level,
  others,
  lessons,
  quizzes,
  units,
  unitId,
}: {
  level: PanelLevel;
  others: { id: string; label: string }[];
  lessons: Option[];
  quizzes: Option[];
  units: { id: string; title: LocalizedText }[];
  unitId: string;
}) {
  const t = useTranslations("Admin.map");
  const e = useTranslations("Admin.errors");
  const lt = useTranslations("LevelType");
  const locale = useLocale();
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const [type, setType] = useState(level.type);
  const [title, setTitle] = useState(toLocalizedForm(level.title));
  const [lessonId, setLessonId] = useState(level.lesson_id ?? "");
  const [quizId, setQuizId] = useState(level.quiz_id ?? "");
  const [rule, setRule] = useState<UnlockRule>(level.unlockRule);
  const [moveTo, setMoveTo] = useState(unitId);
  const values: LevelFormInput = { type, title, lesson_id: lessonId, quiz_id: quizId, unlock_rule: rule };
  const json = JSON.stringify(values);
  const [savedJson, setSavedJson] = useState(json);
  const [saving, startSaving] = useTransition();
  const dirty = json !== savedJson;
  const latest = useRef(values);
  const contentKind = type === "lesson" || type === "story" ? "lesson" : type === "quiz" || type === "boss" ? "quiz" : null;
  const contentId = contentKind === "lesson" ? lessonId : quizId;
  const optionLabel = (o: Option) => `${localize(o.title, locale)?.text ?? o.id.slice(0, 8)}${o.status === "draft" ? ` · ${t("draft")}` : ""}`;
  const unitTitle = (id: string) => localize(units.find((u) => u.id === id)?.title, locale)?.text ?? id.slice(0, 8);

  useEffect(() => {
    latest.current = JSON.parse(json) as LevelFormInput;
  }, [json]);

  const save = () => {
    const snapshot = latest.current;
    startSaving(async () => {
      const result = await saveLevel(level.id, snapshot);
      // Half-finished settings (say, "chosen levels" with none ticked yet) wait quietly for the next edit.
      if (!result.ok) return void (result.error !== "invalid" && toast.error(e(result.error)));
      setSavedJson(JSON.stringify(snapshot));
      router.refresh();
    });
  };

  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(save, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save reads the latest values through a ref
  }, [json, dirty]);

  // Publishing saves pending edits first, so they are never lost.
  const setStatus = (on: boolean) =>
    run(
      async () => {
        if (dirty) {
          const saved = await saveLevel(level.id, latest.current);
          if (!saved.ok) return saved;
          setSavedJson(JSON.stringify(latest.current));
        }
        return setLevelStatus(level.id, on ? "published" : "draft");
      },
      { success: on ? t("levelPublished") : t("levelUnpublished") },
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Switch checked={level.status === "published"} disabled={pending} onCheckedChange={setStatus} />
          {t("published")}
        </label>
        <SaveIndicator state={saving ? "saving" : dirty ? "pending" : "saved"} />
        <ConfirmButton
          trigger={
            <Button type="button" variant="ghost" size="sm" disabled={pending}>
              <Trash2Icon aria-hidden />
              {t("deleteLevel")}
            </Button>
          }
          title={t("deleteLevelTitle")}
          description={t("deleteLevelLead")}
          confirmLabel={t("deleteLevel")}
          onConfirm={() => run(() => deleteLevel(level.id), { success: t("levelDeleted") })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="level-type">{t("type")}</Label>
        <ChoiceSelect id="level-type" value={type} onChange={(v) => v && setType(v)} options={levelTypes.map((value) => ({ value, label: lt(value) }))} />
      </div>

      {contentKind && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="level-content">{t(contentKind)}</Label>
          <ChoiceSelect
            id="level-content"
            value={contentId}
            onChange={contentKind === "lesson" ? setLessonId : setQuizId}
            noneLabel="—"
            options={(contentKind === "lesson" ? lessons : quizzes).map((o) => ({ value: o.id, label: optionLabel(o) }))}
          />
          <div className="flex flex-wrap gap-1">
            {contentId && (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/admin/${contentKind === "lesson" ? "lessons" : "quizzes"}/${contentId}`}>
                  <PencilIcon aria-hidden />
                  {t("openInBuilder")}
                </Link>
              </Button>
            )}
            <NewContentForLevel levelId={level.id} kind={contentKind} initialTitle={title} disabled={type !== level.type} />
          </div>
        </div>
      )}

      <LocalizedFields id="level-title" label={t("levelTitle")} value={title} onChange={setTitle} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t("unlock")}</legend>
        <ChoiceSelect
          aria-label={t("unlock")}
          value={rule.type}
          onChange={(value) => {
            if (!value) return;
            setRule(value === "levels_completed" ? { type: value, levelIds: [] } : value === "unit_stars" ? { type: value, minStars: 3 } : { type: value });
          }}
          options={RULES.map((value) => ({ value, label: t(`rules.${value}`) }))}
        />
        {rule.type === "levels_completed" && (
          <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
            {others.map((other) => (
              <label key={other.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={rule.levelIds.includes(other.id)}
                  onCheckedChange={(on) =>
                    setRule({ type: "levels_completed", levelIds: on === true ? [...rule.levelIds, other.id] : rule.levelIds.filter((id) => id !== other.id) })
                  }
                />
                {other.label}
              </label>
            ))}
          </div>
        )}
        {rule.type === "unit_stars" && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={60}
              aria-label={t("minStars")}
              value={rule.minStars}
              onChange={(ev) => setRule({ type: "unit_stars", minStars: Math.max(1, Number(ev.target.value) || 1) })}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">{t("minStars")}</span>
          </div>
        )}
      </fieldset>

      {units.length > 1 && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="level-unit">{t("moveTo")}</Label>
          <div className="flex gap-2">
            <ChoiceSelect id="level-unit" value={moveTo} onChange={(v) => v && setMoveTo(v)} options={units.map((u) => ({ value: u.id, label: unitTitle(u.id) }))} />
            <ConfirmButton
              trigger={
                <Button type="button" variant="outline" className="h-10" disabled={pending || moveTo === unitId}>
                  {t("moveLevel")}
                </Button>
              }
              title={t("moveLevelTitle", { unit: unitTitle(moveTo) })}
              description={t("moveLevelLead")}
              confirmLabel={t("moveLevel")}
              destructive={false}
              onConfirm={() => run(() => moveLevel(level.id, moveTo), { success: t("levelMoved") })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Whether learners can see the level, and if not, why. */
function Visibility({ level, unitStatus, lessons, quizzes }: { level: PanelLevel; unitStatus: "draft" | "published"; lessons: Option[]; quizzes: Option[] }) {
  const t = useTranslations("Admin.publish");
  const usesLesson = level.type === "lesson" || level.type === "story";
  const contentId = usesLesson ? level.lesson_id : level.quiz_id;
  const contentStatus = contentId ? ((usesLesson ? lessons : quizzes).find((o) => o.id === contentId)?.status ?? null) : null;
  const blockers = levelBlockers({ type: level.type, status: level.status, contentStatus }, unitStatus);
  return blockers.length === 0 ? (
    <p className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm">
      <EyeIcon aria-hidden className="size-4 shrink-0 text-success" />
      {t("levelLive")}
    </p>
  ) : (
    <p className="flex items-start gap-2 rounded-lg bg-gold/15 px-3 py-2 text-sm">
      <EyeOffIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>
        <span className="font-medium">{t("levelHidden")}</span> {blockers.map((b) => t(`levelBlockers.${b}`)).join(" · ")}
      </span>
    </p>
  );
}

/** The unit's levels in journey order, and the settings of the selected one. */
export function LevelPanel({
  unitId,
  unitStatus,
  levels,
  selectedId,
  onSelect,
  onMove,
  lessons,
  quizzes,
  units,
}: {
  unitId: string;
  unitStatus: "draft" | "published";
  levels: PanelLevel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (from: number, to: number) => void;
  lessons: Option[];
  quizzes: Option[];
  units: { id: string; title: LocalizedText }[];
}) {
  const t = useTranslations("Admin.map");
  const lt = useTranslations("LevelType");
  const locale = useLocale();
  const labelOf = (level: PanelLevel, index: number) => localize(level.title, locale)?.text ?? t("levelNumber", { number: index + 1 });
  const selected = levels.find((l) => l.id === selectedId);

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-2">
        {levels.map((level, index) => (
          <li key={level.id} className={cn("flex items-center gap-2 rounded-xl bg-card p-2 ring-1 ring-border", level.id === selectedId && "ring-2 ring-primary")}>
            <button type="button" onClick={() => onSelect(level.id)} className="flex min-w-0 flex-1 items-center gap-2 text-start">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted">
                <LevelIcon type={level.type} className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {index + 1}. {labelOf(level, index)}
                </span>
                <span className="text-xs text-muted-foreground">{lt(level.type)}</span>
              </span>
            </button>
            <StatusBadge status={level.status} />
            <Button type="button" variant="ghost" size="icon-sm" aria-label={t("moveUp")} disabled={index === 0} onClick={() => onMove(index, index - 1)}>
              <ArrowUpIcon aria-hidden />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={t("moveDown")} disabled={index === levels.length - 1} onClick={() => onMove(index, index + 1)}>
              <ArrowDownIcon aria-hidden />
            </Button>
          </li>
        ))}
      </ol>
      {selected && (
        <div className="flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-border">
          <Visibility level={selected} unitStatus={unitStatus} lessons={lessons} quizzes={quizzes} />
          <LevelForm
            key={selected.id}
            level={selected}
            others={levels.filter((l) => l.id !== selected.id).map((l) => ({ id: l.id, label: labelOf(l, levels.indexOf(l)) }))}
            lessons={lessons}
            quizzes={quizzes}
            units={units}
            unitId={unitId}
          />
        </div>
      )}
    </div>
  );
}
