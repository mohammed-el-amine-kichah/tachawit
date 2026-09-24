import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/navigation";

export function PlayerTopBar({ value, label, closeHref = "/" }: { value: number; label: string; closeHref?: string }) {
  const t = useTranslations("Player");
  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <Link
          href={closeHref}
          aria-label={t("close")}
          className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <XIcon aria-hidden className="size-6" />
        </Link>
        <Progress value={value * 100} aria-label={label} className="h-3.5 [&_[data-slot=progress-indicator]]:bg-success" />
      </div>
    </header>
  );
}
