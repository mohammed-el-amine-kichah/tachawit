"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { toast } from "sonner";
import type { AdminError } from "@/lib/admin/result";

type Result = { ok: true } | { ok: false; error: AdminError };

/** Runs an admin action, refreshes the page data and reports the outcome as a translated toast. */
export function useAdminAction() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    <R extends Result>(action: () => Promise<R>, options: { success?: string; onSuccess?: (result: R & { ok: true }) => void; quiet?: boolean } = {}) =>
      startTransition(async () => {
        const result = await action();
        if (result.ok) {
          if (options.success && !options.quiet) toast.success(options.success);
          options.onSuccess?.(result as R & { ok: true });
          router.refresh();
        } else {
          toast.error(t(`errors.${result.error}`));
        }
      }),
    [router, t],
  );

  return { run, pending };
}
