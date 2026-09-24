import { ShieldAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function Forbidden() {
  const t = useTranslations("Admin");
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <ShieldAlertIcon aria-hidden className="size-14 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">{t("forbiddenTitle")}</h1>
      <p className="text-muted-foreground">{t("forbiddenLead")}</p>
      <Button asChild>
        <Link href="/">{t("nav.backToSite")}</Link>
      </Button>
    </main>
  );
}
