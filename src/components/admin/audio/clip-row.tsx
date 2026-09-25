"use client";

import { AlertTriangleIcon, Clock3Icon, LinkIcon, StarIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { deleteClip, linkClip, setClipStatus, setPrimaryClip } from "@/app/actions/admin/clips";
import { PlayButton } from "@/components/audio/play-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { Link } from "@/i18n/navigation";
import type { AdminClip } from "@/lib/admin/queries";
import { splitWords } from "@/lib/audio/karaoke";
import { cn } from "@/lib/utils";
import { ConfirmButton } from "../confirm-button";
import { useAdminAction } from "../use-admin-action";
import { EntryPicker } from "./entry-picker";
import { TimestampEditor } from "./timestamp-editor";

/** One recording: listen, publish, make primary, set word timings, link, delete. */
export function ClipRow({ clip, entryText, showEntry }: { clip: AdminClip; entryText: string | null; showEntry?: boolean }) {
  const t = useTranslations("Admin.audio");
  const player = useAudioPlayer(clip.audio);
  const { run, pending } = useAdminAction();
  const [timingsOpen, setTimingsOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const text = entryText ?? clip.entry?.text_latin ?? null;
  const words = useMemo(() => (text ? splitWords(text) : []), [text]);

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
      <PlayButton player={player} size="sm" label={text ?? undefined} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium">
          {clip.speaker?.name ?? t("unknownSpeaker")}
          {clip.speaker && !clip.speaker.consent && (
            <span className="inline-flex items-center gap-1 text-xs text-destructive">
              <AlertTriangleIcon aria-hidden className="size-3" />
              {t("noConsent")}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {clip.durationMs ? `${(clip.durationMs / 1000).toFixed(2)}s` : "—"}
          {clip.audio.words ? ` · ${t("hasTimings")}` : ""}
          {showEntry &&
            (clip.entry ? (
              <>
                {" · "}
                <Link href={`/admin/entries/${clip.entry.id}`} className="underline underline-offset-2" dir="ltr">
                  {clip.entry.text_latin}
                </Link>
              </>
            ) : (
              ` · ${t("unlinked")}`
            ))}
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Switch
          checked={clip.status === "published"}
          disabled={pending}
          onCheckedChange={(on) => run(() => setClipStatus(clip.id, on ? "published" : "draft"), { success: on ? t("published") : t("unpublished") })}
        />
        {t("publishedLabel")}
      </label>

      {clip.entry && (
        <Button
          type="button"
          variant={clip.isPrimary ? "secondary" : "ghost"}
          size="sm"
          disabled={pending || clip.isPrimary}
          onClick={() => run(() => setPrimaryClip(clip.id), { success: t("primarySet") })}
          aria-pressed={clip.isPrimary}
        >
          <StarIcon aria-hidden className={cn(clip.isPrimary && "fill-gold stroke-gold-foreground/40")} />
          {clip.isPrimary ? t("primary") : t("makePrimary")}
        </Button>
      )}

      {text && (
        <Dialog open={timingsOpen} onOpenChange={setTimingsOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              <Clock3Icon aria-hidden />
              {t("timings")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("timings")}</DialogTitle>
              <DialogDescription dir="ltr">{text}</DialogDescription>
            </DialogHeader>
            <TimestampEditor
              clipId={clip.id}
              url={clip.audio.url}
              durationMs={clip.durationMs ?? 5000}
              words={words}
              initial={clip.audio.words}
              onSaved={() => setTimingsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {showEntry && (
        <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              <LinkIcon aria-hidden />
              {clip.entry ? t("relink") : t("link")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("link")}</DialogTitle>
              <DialogDescription>{t("linkLead")}</DialogDescription>
            </DialogHeader>
            <EntryPicker
              autoFocus
              onPick={(entry) => run(() => linkClip(clip.id, entry.id), { success: t("linked"), onSuccess: () => setLinkOpen(false) })}
            />
          </DialogContent>
        </Dialog>
      )}

      <ConfirmButton
        trigger={
          <Button type="button" variant="ghost" size="icon" aria-label={t("delete")} disabled={pending}>
            <Trash2Icon aria-hidden />
          </Button>
        }
        title={t("deleteTitle")}
        description={t("deleteLead")}
        confirmLabel={t("delete")}
        onConfirm={() => run(() => deleteClip(clip.id), { success: t("deleted") })}
      />
    </li>
  );
}
