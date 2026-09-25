"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { AdminClip } from "@/lib/admin/queries";
import { AudioUploader, type OwnVoice } from "../audio/audio-uploader";
import { ClipRow } from "../audio/clip-row";

/** The recordings of one entry, and adding new ones. */
export function EntryClips({ entryId, entryText, clips, voice }: { entryId: string; entryText: string; clips: AdminClip[]; voice: OwnVoice | null }) {
  const t = useTranslations("Admin.audio");
  const [open, setOpen] = useState(false);
  return (
    <section aria-labelledby="clips-title" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="clips-title" className="font-sans text-lg font-semibold">
          {t("recordings")}
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon aria-hidden />
              {t("add")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{t("add")}</DialogTitle>
              <DialogDescription dir="ltr">{entryText}</DialogDescription>
            </DialogHeader>
            <AudioUploader entryId={entryId} voice={voice} onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      {clips.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">{t("noRecordings")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {clips.map((clip) => (
            <ClipRow key={clip.id} clip={clip} entryText={entryText} />
          ))}
        </ul>
      )}
    </section>
  );
}
