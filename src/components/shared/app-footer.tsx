import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Motif } from "./motif";
import { ZMark } from "./z-mark";

export function AppFooter() {
  const t = useTranslations("Footer");
  const nav = useTranslations("Nav");

  return (
    <footer className="mt-16">
      <Motif variant="band" />
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ZMark className="size-5 text-primary" />
          <div>
            <p className="font-heading text-base text-foreground">{t("tagline")}</p>
            <p>{t("credits")}</p>
          </div>
        </div>
        <nav aria-label={nav("label")}>
          <ul className="flex gap-4">
            <li>
              <Link href="/" className="underline-offset-4 hover:text-foreground hover:underline">
                {nav("journey")}
              </Link>
            </li>
            <li>
              <Link href="/design" className="underline-offset-4 hover:text-foreground hover:underline">
                {nav("design")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
