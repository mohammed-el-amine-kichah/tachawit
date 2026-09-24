"use client";

import { useTranslations } from "next-intl";
import { setUserRole } from "@/app/actions/admin/users";
import { Switch } from "@/components/ui/switch";
import { useAdminAction } from "./use-admin-action";

export function UserRoleSwitch({ id, admin, self }: { id: string; admin: boolean; self: boolean }) {
  const t = useTranslations("Admin.users");
  const { run, pending } = useAdminAction();
  return (
    <label className="flex items-center gap-2 text-sm">
      <Switch
        checked={admin}
        disabled={pending || self}
        onCheckedChange={(on) => run(() => setUserRole(id, on ? "admin" : "learner"), { success: on ? t("promoted") : t("demoted") })}
      />
      {t("admin")}
    </label>
  );
}
