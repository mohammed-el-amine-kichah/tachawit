"use client";

import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { deleteLevel, moveLevel, saveLevel, setLevelStatus } from "@/app/actions/admin/map";
import { LevelIcon } from "@/components/map/level-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { localize } from "@/i18n/localize";
import { levelTypes } from "@/lib/content/enums";
import type { LocalizedText } from "@/lib/content/localized-text";
import type { UnlockRule } from "@/lib/content/unlock-rule";
import type { LevelType } from "@/lib/supabase/queries/units";
import { cn } from "@/lib/utils";
import { ConfirmButton } from "../confirm-button";
import { LocalizedFields, toLocalizedForm } from "../localized-fields";
import { StatusBadge } from "../status-badge";
import { useAdminAction } from "../use-admin-action";

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

const selectClassName = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

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
  const lt = useTranslations("LevelType");
  const locale = useLocale();
  const { run, pending } = useAdminAction();
  const [type, setType] = useState(level.type);
  const [title, setTitle] = useState(toLocalizedForm(level.title));
  const [lessonId, setLessonId] = useState(level.lesson_id ?? "");
  const [quizId, setQuizId] = useState(level.quiz_id ?? "");
  const [rule, setRule] = useState<UnlockRule>(level.unlockRule);
  const optionLabel = (o: Option) => `${localize(o.title, locale)?.text ?? o.id.slice(0, 8)}${o.status === "draft" ? ` · ${t("draft")}` : ""}`;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => saveLevel(level.id, { type, title, lesson_id: lessonId, quiz_id: quizId, unlock_rule: rule }), { success: t("levelSaved") });
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Switch
            checked={level.status === "published"}
            disabled={pending}
            onCheckedChange={(on) => run(() => setLevelStatus(level.id, on ? "published" : "draft"), { success: on ? t("levelPublished") : t("levelUnpublished") })}
          />
          {t("published")}
        </label>
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
        <select id="level-type" className={selectClassName} value={type} onChange={(e) => setType(e.target.value as LevelType)}>
          {levelTypes.map((value) => (
            <option key={value} value={value}>
              {lt(value)}
            </option>
          ))}
        </select>
      </div>

      {(type === "lesson" || type === "story") && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="level-lesson">{t("lesson")}</Label>
          <select id="level-lesson" className={selectClassName} value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
            <option value="">—</option>
            {lessons.map((o) => (
              <option key={o.id} value={o.id}>
                {optionLabel(o)}
              </option>
            ))}
          </select>
        </div>
      )}
      {(type === "quiz" || type === "boss") && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="level-quiz">{t("quiz")}</Label>
          <select id="level-quiz" className={selectClassName} value={quizId} onChange={(e) => setQuizId(e.target.value)}>
            <option value="">—</option>
            {quizzes.map((o) => (
              <option key={o.id} value={o.id}>
                {optionLabel(o)}
              </option>
            ))}
          </select>
        </div>
      )}

      <LocalizedFields id="level-title" label={t("levelTitle")} value={title} onChange={setTitle} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t("unlock")}</legend>
        <select
          aria-label={t("unlock")}
          className={selectClassName}
          value={rule.type}
          onChange={(e) => {
            const value = e.target.value as UnlockRule["type"];
            setRule(value === "levels_completed" ? { type: value, levelIds: [] } : value === "unit_stars" ? { type: value, minStars: 3 } : { type: value });
          }}
        >
          {(["previous_completed", "always", "levels_completed", "unit_stars"] as const).map((value) => (
            <option key={value} value={value}>
              {t(`rules.${value}`)}
            </option>
          ))}
        </select>
        {rule.type === "levels_completed" && (
          <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
            {others.map((other) => (
              <label key={other.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={rule.levelIds.includes(other.id)}
                  onChange={(e) =>
                    setRule({ type: "levels_completed", levelIds: e.target.checked ? [...rule.levelIds, other.id] : rule.levelIds.filter((id) => id !== other.id) })
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
              onChange={(e) => setRule({ type: "unit_stars", minStars: Math.max(1, Number(e.target.value) || 1) })}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">{t("minStars")}</span>
          </div>
        )}
      </fieldset>

      <div className="flex flex-col gap-1">
        <Label htmlFor="level-unit">{t("moveTo")}</Label>
        <select id="level-unit" className={selectClassName} value={unitId} onChange={(e) => run(() => moveLevel(level.id, e.target.value), { success: t("levelMoved") })}>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {localize(u.title, locale)?.text ?? u.id.slice(0, 8)}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {t("saveLevel")}
      </Button>
    </form>
  );
}

/** The unit's levels in journey order, and the settings of the selected one. */
export function LevelPanel({
  unitId,
  levels,
  selectedId,
  onSelect,
  onMove,
  lessons,
  quizzes,
  units,
}: {
  unitId: string;
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
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <LevelForm
            key={JSON.stringify(selected)}
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
