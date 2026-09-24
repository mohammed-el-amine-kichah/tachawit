"use client";

import { PlusIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCultureNote } from "@/app/actions/admin/culture";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPathname } from "@/i18n/navigation";
import { cultureCategories } from "@/lib/content/enums";
import type { CultureCategory } from "@/lib/supabase/queries/culture";
import { LocalizedFields } from "../localized-fields";
import { emptyLocalized } from "../localized-form";
import { useAdminAction } from "../use-admin-action";

export function NewCultureButton() {
  const t = useTranslations("Admin.culture");
  const cats = useTranslations("Culture.categories");
  const locale = useLocale();
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const [values, setValues] = useState({ slug: "", category: "other" as CultureCategory, title: emptyLocalized });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon aria-hidden />
          {t("new")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("new")}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => createCultureNote(values), { onSuccess: (r) => r.id && router.push(getPathname({ href: `/admin/culture/${r.id}`, locale })) });
          }}
        >
          <LocalizedFields id="new-culture-title" label={t("title")} required value={values.title} onChange={(title) => setValues({ ...values, title })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="new-culture-slug">{t("slug")}</Label>
              <Input id="new-culture-slug" dir="ltr" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={values.slug} onChange={(e) => setValues({ ...values, slug: e.target.value.toLowerCase() })} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="new-culture-category">{t("category")}</Label>
              <select id="new-culture-category" value={values.category} onChange={(e) => setValues({ ...values, category: e.target.value as CultureCategory })} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                {cultureCategories.map((c) => (
                  <option key={c} value={c}>
                    {cats(c)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" disabled={pending} className="self-start">
            {t("create")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
