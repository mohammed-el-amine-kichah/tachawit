"use client";

import { CheckIcon, LoaderIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { useSendQueue } from "./use-send-queue";

/** How many recordings were sent, what is still on its way, and the way out of the session. */
export function SessionStatus({ queue, onFinish }: { queue: ReturnType<typeof useSendQueue>; onFinish: () => void }) {
  const t = useTranslations("Contribute");
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm" aria-live="polite">
          {queue.pending > 0 ? (
            <>
              <LoaderIcon aria-hidden className="size-4 motion-safe:animate-spin" />
              {t("sending", { count: queue.pending })}
            </>
          ) : (
            <>
              <CheckIcon aria-hidden className="size-4 text-success" />
              {t("sent", { count: queue.sent })}
            </>
          )}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onFinish}>
          {t("finish")}
        </Button>
      </div>
      {queue.failed > 0 && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>
            {t("notSent", { count: queue.failed })} {queue.error && t(`errors.${queue.error}`)}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={queue.retry}>
            {t("retry")}
          </Button>
        </div>
      )}
    </div>
  );
}
