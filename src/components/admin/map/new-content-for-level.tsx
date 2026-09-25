"use client";

import { PlusIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createContentForLevel } from "@/app/actions/admin/map";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getPathname } from "@/i18n/navigation";
import { LocalizedFields, type LocalizedFormValue } from "../localized-fields";
import { useAdminAction } from "../use-admin-action";

/** Creates the lesson or quiz a level shows, already linked to it, and opens it in the builder. */
export function NewContentForLevel({ levelId, kind, initialTitle, disabled }: { levelId: string; kind: "lesson" | "quiz"; initialTitle: LocalizedFormValue; disabled?: boolean }) {
  const t = useTranslations("Admin.map");
  const b = useTranslations("Admin.builder");
  const locale = useLocale();
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const label = t(kind === "lesson" ? "newLessonForLevel" : "newQuizForLevel");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setTitle(initialTitle);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" disabled={disabled}>
          <PlusIcon aria-hidden />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>{t("newContentForLevelLead")}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => createContentForLevel(levelId, title), {
              onSuccess: (result) => result.id && router.push(getPathname({ href: `/admin/${kind === "lesson" ? "lessons" : "quizzes"}/${result.id}`, locale })),
            });
          }}
        >
          <LocalizedFields id={`new-content-${levelId}`} label={b("title")} required value={title} onChange={setTitle} />
          <Button type="submit" disabled={pending} className="self-start">
            {b("create")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
