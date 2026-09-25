"use client";

import { CheckIcon, MailIcon, XIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { approveSubmission, rejectSubmission } from "@/app/actions/admin/submissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localize } from "@/i18n/localize";
import { Link } from "@/i18n/navigation";
import type { LocalizedText } from "@/lib/content/localized-text";
import { LocalizedFields } from "../localized-fields";
import { toLocalizedForm } from "../localized-form";
import { useAdminAction } from "../use-admin-action";
import { ChoiceSelect } from "../choice-select";

export type SubmissionView = {
  id: string;
  kind: "word" | "variation" | "correction" | "recording";
  status: "pending" | "approved" | "rejected";
  text_latin: string | null;
  text_arabic: string | null;
  text_tifinagh: string | null;
  translations: LocalizedText | null;
  region_id: string | null;
  village: string | null;
  message: string | null;
  audioUrl: string | null;
  audio_consent: boolean;
  contributor_name: string | null;
  contributor_email: string | null;
  created_at: string;
  review_note: string | null;
  created_entry_id: string | null;
  related: { id: string; text_latin: string } | null;
};

/** One contribution: listen, adjust, then approve (as drafts) or reject. */
export function SubmissionCard({ submission: s, regions }: { submission: SubmissionView; regions: { id: string; name: LocalizedText }[] }) {
  const t = useTranslations("Admin.submissions");
  const kinds = useTranslations("Contribute.kinds");
  const format = useFormatter();
  const locale = useLocale();
  const { run, pending } = useAdminAction();
  const [edits, setEdits] = useState({
    text_latin: s.text_latin ?? "",
    text_arabic: s.text_arabic ?? "",
    text_tifinagh: s.text_tifinagh ?? "",
    translations: toLocalizedForm(s.translations),
    region_id: s.region_id ?? "",
  });
  const [note, setNote] = useState("");
  const editable = s.status === "pending" && s.kind !== "correction";

  return (
    <li className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{kinds(s.kind)}</Badge>
        <span className="text-sm text-muted-foreground">{format.dateTime(new Date(s.created_at), { dateStyle: "medium", timeStyle: "short" })}</span>
        <span className="text-sm">
          {s.contributor_name ?? t("anonymous")}
          {s.contributor_email && (
            <a href={`mailto:${s.contributor_email}`} className="ms-2 inline-flex items-center gap-1 text-primary underline" dir="ltr">
              <MailIcon aria-hidden className="size-3" />
              {s.contributor_email}
            </a>
          )}
        </span>
        {s.village && <span className="text-sm text-muted-foreground">· {s.village}</span>}
      </div>

      {s.related && (
        <p className="text-sm">
          {t("about")}{" "}
          <Link href={`/admin/entries/${s.related.id}`} className="font-semibold underline" dir="ltr">
            {s.related.text_latin}
          </Link>
        </p>
      )}
      {s.message && <p className="rounded-lg bg-muted/60 px-3 py-2 whitespace-pre-line">{s.message}</p>}
      {s.audioUrl && (
        <div className="flex flex-wrap items-center gap-3">
          <audio controls preload="none" src={s.audioUrl} className="h-10 max-w-full" aria-label={t("recording")} />
          <span className="text-xs text-muted-foreground">{s.audio_consent ? t("consentGiven") : t("noConsent")}</span>
        </div>
      )}

      {editable ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1 sm:col-span-3">
            <Label htmlFor={`${s.id}-latin`}>{t("latin")}</Label>
            <Input id={`${s.id}-latin`} dir="ltr" value={edits.text_latin} onChange={(e) => setEdits({ ...edits, text_latin: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${s.id}-arabic`}>{t("arabic")}</Label>
            <Input id={`${s.id}-arabic`} dir="rtl" value={edits.text_arabic} onChange={(e) => setEdits({ ...edits, text_arabic: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${s.id}-tifinagh`}>{t("tifinagh")}</Label>
            <Input id={`${s.id}-tifinagh`} dir="ltr" value={edits.text_tifinagh} onChange={(e) => setEdits({ ...edits, text_tifinagh: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${s.id}-region`}>{t("region")}</Label>
            <ChoiceSelect
              id={`${s.id}-region`}
              value={edits.region_id}
              onChange={(region_id) => setEdits({ ...edits, region_id })}
              noneLabel="—"
              options={regions.map((r) => ({ value: r.id, label: localize(r.name, locale)?.text ?? r.id.slice(0, 8) }))}
            />
          </div>
          <div className="sm:col-span-3">
            <LocalizedFields id={`${s.id}-meaning`} label={t("meaning")} value={edits.translations} onChange={(translations) => setEdits({ ...edits, translations })} />
          </div>
        </div>
      ) : (
        (s.text_latin || s.translations) && (
          <p>
            <span className="font-semibold" dir="ltr">
              {s.text_latin}
            </span>{" "}
            <span className="text-muted-foreground">{localize(s.translations, locale)?.text}</span>
          </p>
        )
      )}

      {s.status === "pending" ? (
        <div className="flex flex-wrap items-end gap-2 border-t pt-4">
          <Button
            type="button"
            disabled={pending}
            className="bg-success text-success-foreground hover:bg-success/90"
            onClick={() => run(() => approveSubmission(s.id, edits), { success: s.kind === "correction" ? t("approvedCorrection") : t("approved") })}
          >
            <CheckIcon aria-hidden />
            {t(s.kind === "correction" ? "markDone" : "approve")}
          </Button>
          <Input aria-label={t("rejectNote")} placeholder={t("rejectNote")} value={note} onChange={(e) => setNote(e.target.value)} className="h-9 max-w-xs" />
          <Button type="button" variant="outline" disabled={pending} onClick={() => run(() => rejectSubmission(s.id, note), { success: t("rejected") })}>
            <XIcon aria-hidden />
            {t("reject")}
          </Button>
        </div>
      ) : (
        <p className="border-t pt-3 text-sm text-muted-foreground">
          {s.review_note}
          {s.created_entry_id && (
            <Link href={`/admin/entries/${s.created_entry_id}`} className="ms-2 font-medium text-primary underline">
              {t("openEntry")}
            </Link>
          )}
        </p>
      )}
    </li>
  );
}
