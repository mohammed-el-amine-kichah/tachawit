"use client";

import { HeartHandshakeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/** End of a session. Recordings still on their way keep sending while the page stays open. */
export function SessionThanks({ sent, pending, onMore }: { sent: number; pending: number; onMore: () => void }) {
  const t = useTranslations("Contribute");
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-card p-8 text-center shadow-soft ring-1 ring-border" role="status">
      <HeartHandshakeIcon aria-hidden className="size-14 text-success" />
      <h2 className="text-2xl font-semibold">{t("thanks")}</h2>
      {sent + pending > 0 && <p className="text-muted-foreground">{t("thanksLead", { count: sent + pending })}</p>}
      {pending > 0 && <p className="text-sm">{t("sending", { count: pending })}</p>}
      <Button onClick={onMore}>{t("more")}</Button>
    </div>
  );
}
