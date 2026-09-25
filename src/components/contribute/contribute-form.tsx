"use client";

import { HeartHandshakeIcon, MicIcon, PlayIcon, RotateCcwIcon, SquareIcon, UploadIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { submitContribution, type ContributionResult, type PublicEntryOption } from "@/app/actions/contribute";
import { useAccount } from "@/components/auth/account-context";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMediaRecorder } from "@/hooks/use-media-recorder";
import { localize } from "@/i18n/localize";
import { Link } from "@/i18n/navigation";
import { playOnce } from "@/lib/audio/bus";
import type { LocalizedText } from "@/lib/content/localized-text";
import { contributionKinds, type ContributionKind } from "@/lib/culture/contribution";
import { PublicEntryPicker } from "./public-entry-picker";

/** Share a word, a local variant, a correction or a recording. Everything is reviewed before publishing. */
export function ContributeForm({ regions }: { regions: { id: string; name: LocalizedText }[] }) {
  const t = useTranslations("Contribute");
  const account = useAccount();
  const locale = useLocale();
  const [kind, setKind] = useState<ContributionKind>("word");
  const [entry, setEntry] = useState<PublicEntryOption | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<ContributionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const recorder = useMediaRecorder(30);
  const form = useRef<HTMLFormElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const audio = file ?? recorder.blob;

  if (result?.ok) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-card p-8 text-center shadow-soft ring-1 ring-border" role="status">
        <HeartHandshakeIcon aria-hidden className="size-14 text-success" />
        <h2 className="text-2xl font-semibold">{t("thanks")}</h2>
        <p className="text-muted-foreground">{t("thanksLead")}</p>
        <Button
          onClick={() => {
            setResult(null);
            setEntry(null);
            setFile(null);
            setConsent(false);
            recorder.reset();
          }}
        >
          {t("another")}
        </Button>
      </div>
    );
  }

  return (
    <form
      ref={form}
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        data.set("kind", kind);
        data.set("related_entry_id", entry?.id ?? "");
        data.set("audio_consent", consent ? "on" : "");
        if (kind === "recording" && audio) data.set("audio", audio, file?.name ?? "recording.webm");
        startTransition(async () => setResult(await submitContribution(data)));
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t("kindLabel")}</legend>
        <ToggleGroup
          type="single"
          variant="outline"
          value={kind}
          onValueChange={(value) => value && setKind(value as ContributionKind)}
          className="flex w-full flex-wrap"
        >
          {contributionKinds.map((k) => (
            <ToggleGroupItem key={k} value={k} className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              {t(`kinds.${k}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-sm text-muted-foreground">{t(`kindHints.${kind}`)}</p>
      </fieldset>

      {(kind === "variation" || kind === "correction" || kind === "recording") && (
        <PublicEntryPicker label={t(kind === "variation" ? "variantOf" : kind === "correction" ? "correctionOf" : "recordingOf")} value={entry} onChange={setEntry} />
      )}

      {kind !== "correction" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1 sm:col-span-3">
            <Label htmlFor="text_latin">{t(kind === "recording" ? "whatIsSaid" : kind === "variation" ? "localForm" : "word")}</Label>
            <Input id="text_latin" name="text_latin" dir="ltr" lang="shy-Latn" required={kind === "word" || kind === "variation"} maxLength={200} className="h-12 text-lg" />
          </div>
          {kind !== "recording" && (
            <>
              <div className="flex flex-col gap-1">
                <Label htmlFor="text_arabic">{t("arabicScript")}</Label>
                <Input id="text_arabic" name="text_arabic" dir="rtl" lang="shy-Arab" maxLength={200} className="font-arabic" />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <Label htmlFor="text_tifinagh">{t("tifinagh")}</Label>
                <Input id="text_tifinagh" name="text_tifinagh" dir="ltr" lang="shy-Tfng" maxLength={200} className="font-tifinagh" />
              </div>
            </>
          )}
        </div>
      )}

      {kind === "word" && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="meaning">{t("meaning")}</Label>
          <Input id="meaning" name="meaning" required maxLength={200} />
        </div>
      )}

      {kind === "recording" && !account && (
        <p className="rounded-2xl bg-muted/50 p-4 text-sm">
          {t("signInToRecord")}{" "}
          <Link href="/login" className="font-medium text-primary underline underline-offset-4">
            {t("signInLink")}
          </Link>
        </p>
      )}

      {kind === "recording" && account && (
        <div className="flex flex-col gap-3 rounded-2xl bg-muted/50 p-4">
          {audio ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => void playOnce(URL.createObjectURL(audio))}>
                <PlayIcon aria-hidden />
                {t("listen")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setFile(null);
                  recorder.reset();
                }}
              >
                <RotateCcwIcon aria-hidden />
                {t("redo")}
              </Button>
            </div>
          ) : recorder.state === "recording" ? (
            <Button type="button" variant="secondary" size="lg" onClick={recorder.stop}>
              <SquareIcon aria-hidden className="fill-current" />
              {t("stop")}
              <span aria-hidden className="size-2 rounded-full bg-destructive motion-safe:animate-pulse" />
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recorder.supported && (
                <Button type="button" size="lg" onClick={() => void recorder.start()} disabled={recorder.state === "requesting"}>
                  <MicIcon aria-hidden />
                  {t("record")}
                </Button>
              )}
              <Button type="button" size="lg" variant="outline" onClick={() => fileInput.current?.click()}>
                <UploadIcon aria-hidden />
                {t("uploadFile")}
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept="audio/*"
                className="sr-only"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </div>
          )}
          {recorder.state === "denied" && <p className="text-sm text-destructive">{t("micDenied")}</p>}
          <label className="flex items-start gap-3">
            <Checkbox checked={consent} onCheckedChange={(c) => setConsent(c === true)} className="mt-0.5" />
            <span className="text-sm">{t("consent")}</span>
          </label>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="region_id">{t("region")}</Label>
          <select id="region_id" name="region_id" defaultValue="" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">—</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {localize(r.name, locale)?.text}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="village">{t("village")}</Label>
          <Input id="village" name="village" maxLength={120} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="message">{t(kind === "correction" ? "whatToFix" : "notes")}</Label>
        <Textarea id="message" name="message" rows={3} maxLength={2000} required={kind === "correction"} />
      </div>

      {account ? (
        <div className="rounded-2xl bg-muted/50 p-4">
          <p className="text-sm font-medium">{t("sendingAs", { name: account.displayName ?? account.email ?? "" })}</p>
          <p className="text-xs text-muted-foreground">{t("sendingAsLead")}</p>
        </div>
      ) : (
        <fieldset className="grid gap-4 rounded-2xl bg-muted/50 p-4 sm:grid-cols-2">
          <legend className="sr-only">{t("aboutYou")}</legend>
          <div className="flex flex-col gap-1">
            <Label htmlFor="contributor_name">{t("name")}</Label>
            <Input id="contributor_name" name="contributor_name" maxLength={80} autoComplete="name" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="contributor_email">{t("email")}</Label>
            <Input id="contributor_email" name="contributor_email" type="email" dir="ltr" maxLength={254} autoComplete="email" />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">{t("privacy")}</p>
        </fieldset>
      )}

      {/* Hidden from people; bots fill it in. */}
      <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {result && !result.ok && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t(`errors.${result.error}`)}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending || (kind === "recording" && (!account || !audio || !consent))} className="h-12 self-start rounded-xl px-6 text-base">
        {pending ? t("sending") : t("send")}
      </Button>
    </form>
  );
}
