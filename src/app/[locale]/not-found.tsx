import { useTranslations } from "next-intl";
import { Motif } from "@/components/shared/motif";
import { ZMark } from "@/components/shared/z-mark";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <main id="main" className="mx-auto flex max-w-md flex-1 flex-col items-center px-4 py-20 text-center">
      <ZMark className="size-14 text-primary" />
      <h1 className="mt-6 text-3xl font-semibold">{t("title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("lead")}</p>
      <Motif variant="zigzag" className="my-8 max-w-40" />
      <Button asChild size="lg">
        <Link href="/">{t("back")}</Link>
      </Button>
    </main>
  );
}
