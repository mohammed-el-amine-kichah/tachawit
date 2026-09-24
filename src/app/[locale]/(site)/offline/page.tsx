import { WifiOffIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Offline");
  return { title: t("title"), robots: { index: false } };
}

/** Shown by the service worker when a page that was never opened is requested offline. */
export default async function OfflinePage() {
  const t = await getTranslations("Offline");
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 py-16 text-center">
      <WifiOffIcon aria-hidden className="size-14 text-muted-foreground" />
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("lead")}</p>
      <Button asChild size="lg" className="mt-4 rounded-full">
        <Link href="/">{t("backToMap")}</Link>
      </Button>
    </div>
  );
}
