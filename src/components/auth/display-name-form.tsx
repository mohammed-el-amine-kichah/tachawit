"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { updateDisplayName, type ProfileFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DisplayNameForm({ current }: { current: string | null }) {
  const t = useTranslations("Profile");
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateDisplayName, { status: "idle" });
  return (
    <form action={action} className="flex flex-col gap-2">
      <Label htmlFor="displayName">{t("displayName")}</Label>
      <div className="flex gap-2">
        <Input id="displayName" name="displayName" defaultValue={current ?? ""} maxLength={60} required className="h-11" />
        <Button type="submit" disabled={pending} className="h-11">
          {t("save")}
        </Button>
      </div>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {state.status === "saved" ? t("saved") : state.status === "error" ? t("saveError") : null}
      </p>
    </form>
  );
}
