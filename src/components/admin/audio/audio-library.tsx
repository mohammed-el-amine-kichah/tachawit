"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { AdminClip } from "@/lib/admin/queries";
import { AudioUploader, type SpeakerOption } from "./audio-uploader";
import { ClipRow } from "./clip-row";

export function AudioLibrary({ clips, speakers }: { clips: AdminClip[]; speakers: SpeakerOption[] }) {
  const t = useTranslations("Admin.audio");
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="self-start">
            <PlusIcon aria-hidden />
            {t("upload")}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("upload")}</DialogTitle>
            <DialogDescription>{t("uploadLead")}</DialogDescription>
          </DialogHeader>
          <AudioUploader entryId={null} speakers={speakers} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
      {clips.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-muted-foreground">{t("noRecordings")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {clips.map((clip) => (
            <ClipRow key={clip.id} clip={clip} entryText={null} showEntry />
          ))}
        </ul>
      )}
    </div>
  );
}
