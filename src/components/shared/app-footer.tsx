import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Motif } from "./motif";
import { ZMark } from "./z-mark";

export function AppFooter() {
  const t = useTranslations("Footer");
  const nav = useTranslations("Nav");

  return (
    <footer className="mt-16 pb-20 md:pb-0">
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
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {(["/about", "/contribute", "/culture", "/design"] as const).map((href) => (
              <li key={href}>
                <Link href={href} className="underline-offset-4 hover:text-foreground hover:underline">
                  {nav(href.slice(1) as "about" | "contribute" | "culture" | "design")}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
