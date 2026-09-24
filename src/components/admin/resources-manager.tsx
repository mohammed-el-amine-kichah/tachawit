"use client";

import { ExternalLinkIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { deleteResource, saveResource, setResourceStatus } from "@/app/actions/admin/resources";
import { SocialIcon } from "@/components/shared/social-icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localize } from "@/i18n/localize";
import { resourcePlatforms, type ResourcePlatform } from "@/lib/content/enums";
import type { LocalizedText } from "@/lib/content/localized-text";
import { isPlatformUrl, platformOfUrl } from "@/lib/resources/platform";
import { cn } from "@/lib/utils";
import { ConfirmButton } from "./confirm-button";
import { emptyLocalized, LocalizedFields, toLocalizedForm } from "./localized-fields";
import { StatusBadge } from "./status-badge";
import { useAdminAction } from "./use-admin-action";

export type AdminResource = {
  id: string;
  platform: ResourcePlatform;
  name: string;
  url: string;
  summary: LocalizedText;
  status: "draft" | "published";
};

const emptyForm = { platform: "youtube" as ResourcePlatform, name: "", url: "", summary: emptyLocalized, status: "published" as "draft" | "published" };

/** Links to videos, accounts and pages on other platforms that help learners practise. */
export function ResourcesManager({ resources }: { resources: AdminResource[] }) {
  const t = useTranslations("Admin.resources");
  const platforms = useTranslations("Resources.platforms");
  const locale = useLocale();
  const { run, pending } = useAdminAction();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const urlMismatch = form.url.trim() !== "" && !isPlatformUrl(form.platform, form.url.trim());

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {resources.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {resources.map((r) => (
            <li key={r.id} className={cn("flex flex-col gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-border", editingId === r.id && "ring-2 ring-primary")}>
              <div className="flex items-start gap-3">
                <SocialIcon network={r.platform} className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium break-words">{r.name}</p>
                  <p className="text-sm text-muted-foreground">{localize(r.summary, locale)?.text}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(() => setResourceStatus(r.id, r.status === "published" ? "draft" : "published"), {
                      success: r.status === "published" ? t("unpublished") : t("published"),
                    })
                  }
                >
                  {r.status === "published" ? t("unpublish") : t("publish")}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("edit")}
                  onClick={() => {
                    setEditingId(r.id);
                    setForm({ platform: r.platform, name: r.name, url: r.url, summary: toLocalizedForm(r.summary), status: r.status });
                  }}
                >
                  <PencilIcon aria-hidden />
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label={t("open", { platform: platforms(r.platform) })}>
                    <ExternalLinkIcon aria-hidden />
                  </a>
                </Button>
                <ConfirmButton
                  trigger={
                    <Button variant="ghost" size="icon" aria-label={t("delete")} disabled={pending}>
                      <Trash2Icon aria-hidden />
                    </Button>
                  }
                  title={t("deleteTitle")}
                  description={t("deleteLead")}
                  confirmLabel={t("delete")}
                  onConfirm={() => run(() => deleteResource(r.id), { success: t("deleted"), onSuccess: () => editingId === r.id && reset() })}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex flex-col gap-4 self-start rounded-2xl bg-card p-5 ring-1 ring-border"
        onSubmit={(event) => {
          event.preventDefault();
          run(() => saveResource(editingId, form), { success: editingId ? t("saved") : t("added"), onSuccess: reset });
        }}
      >
        <h2 className="font-sans text-lg font-semibold">{editingId ? t("editTitle") : t("add")}</h2>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{t("platform")}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {resourcePlatforms.map((platform) => (
              <label
                key={platform}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  form.platform === platform ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground",
                )}
              >
                <input type="radio" name="platform" value={platform} checked={form.platform === platform} onChange={() => setForm({ ...form, platform })} className="sr-only" />
                <SocialIcon network={platform} className="size-4 shrink-0" />
                {platforms(platform)}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col gap-1">
          <Label htmlFor="resource-url">{t("url")}</Label>
          <Input
            id="resource-url"
            type="url"
            dir="ltr"
            required
            inputMode="url"
            placeholder="https://"
            aria-invalid={urlMismatch}
            aria-describedby="resource-url-hint"
            value={form.url}
            onChange={(e) => {
              const url = e.target.value;
              setForm({ ...form, url, platform: platformOfUrl(url.trim()) ?? form.platform });
            }}
          />
          <p id="resource-url-hint" className={cn("text-xs", urlMismatch ? "text-destructive" : "text-muted-foreground")}>
            {urlMismatch ? t("urlMismatch", { platform: platforms(form.platform) }) : t("urlHint")}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="resource-name">{t("name")}</Label>
          <Input id="resource-name" required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <p className="text-xs text-muted-foreground">{t("nameHint")}</p>
        </div>
        <LocalizedFields id="resource-summary" label={t("summary")} required multiline value={form.summary} onChange={(summary) => setForm({ ...form, summary })} />
        <div className="flex items-center gap-2">
          <Checkbox
            id="resource-published"
            checked={form.status === "published"}
            onCheckedChange={(checked) => setForm({ ...form, status: checked === true ? "published" : "draft" })}
          />
          <Label htmlFor="resource-published">{t("visible")}</Label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending || urlMismatch}>
            {editingId ? t("save") : t("add")}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={reset}>
              {t("cancelEdit")}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
