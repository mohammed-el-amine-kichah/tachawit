"use client";

import { WifiOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOnline } from "@/hooks/use-online";

/** A quiet strip shown while the device is offline. */
export function OfflineBanner() {
  const t = useTranslations("Offline");
  const online = useOnline();
  if (online) return null;
  return (
    <p role="status" className="flex items-center justify-center gap-2 bg-muted px-4 py-2 text-center text-sm text-muted-foreground">
      <WifiOffIcon aria-hidden className="size-4 shrink-0" />
      {t("banner")}
    </p>
  );
}
