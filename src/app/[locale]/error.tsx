"use client";

import { RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { ZMark } from "@/components/shared/z-mark";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("Error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="mx-auto flex max-w-md flex-1 flex-col items-center gap-4 px-5 py-20 text-center">
      <ZMark className="size-14 text-primary" />
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("lead")}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Button size="lg" className="rounded-full" onClick={retry}>
          <RotateCcwIcon aria-hidden />
          {t("retry")}
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full">
          <Link href="/">{t("backToMap")}</Link>
        </Button>
      </div>
    </main>
  );
}
