"use client";

import { PlusIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createContent } from "@/app/actions/admin/content";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getPathname } from "@/i18n/navigation";
import { emptyLocalized, LocalizedFields } from "../localized-fields";
import { useAdminAction } from "../use-admin-action";

export function NewContentButton({ kind }: { kind: "lesson" | "quiz" }) {
  const t = useTranslations("Admin.builder");
  const locale = useLocale();
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const [title, setTitle] = useState(emptyLocalized);
  const [open, setOpen] = useState(false);
  const base = kind === "lesson" ? "/admin/lessons" : "/admin/quizzes";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon aria-hidden />
          {t(kind === "lesson" ? "newLesson" : "newQuiz")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(kind === "lesson" ? "newLesson" : "newQuiz")}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => createContent(kind, title), {
              onSuccess: (result) => result.id && router.push(getPathname({ href: `${base}/${result.id}`, locale })),
            });
          }}
        >
          <LocalizedFields id="new-title" label={t("title")} required value={title} onChange={setTitle} />
          <Button type="submit" disabled={pending} className="self-start">
            {t("create")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
