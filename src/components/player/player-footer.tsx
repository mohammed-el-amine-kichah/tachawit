import { ChevronLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/** Sticky bottom bar with the main action, within thumb reach on phones. */
export function PlayerFooter({
  onBack,
  children,
}: {
  onBack?: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("Player");
  return (
    <footer className="sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {onBack && (
          <Button variant="ghost" size="icon-lg" onClick={onBack} aria-label={t("back")} className="size-12 rounded-full">
            <ChevronLeftIcon aria-hidden className="size-6 rtl:-scale-x-100" />
          </Button>
        )}
        {children}
      </div>
    </footer>
  );
}
