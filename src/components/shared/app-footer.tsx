import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { socialLinks } from "@/lib/site/social";
import { Motif } from "./motif";
import { SocialIcon } from "./social-icon";
import { ZMark } from "./z-mark";

const columns = [
  { title: "learn", links: ["/", "/review", "/culture", "/resources"] },
  { title: "involved", links: ["/contribute", "/about"] },
] as const;

const linkKey = { "/": "journey", "/review": "review", "/culture": "culture", "/resources": "resources", "/contribute": "contribute", "/about": "about" } as const;

export function AppFooter() {
  const t = useTranslations("Footer");
  const nav = useTranslations("Nav");

  return (
    <footer className="mt-16 bg-card/60 pb-20 md:pb-0">
      <Motif variant="band" />
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex w-fit items-center gap-2 rounded-lg">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ZMark className="size-6" />
            </span>
            <span className="font-heading text-xl text-foreground">{t("brand")}</span>
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">{t("credits")}</p>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">{t("follow")}</p>
            <ul className="flex gap-2">
              {socialLinks.map(({ network, href }) => (
                <li key={network}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t(`social.${network}`)}
                    className="grid size-10 place-items-center rounded-full border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <SocialIcon network={network} className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {columns.map(({ title, links }) => (
          <nav key={title} aria-label={t(title)} className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">{t(title)}</p>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {links.map((href) => (
                <li key={href}>
                  <Link href={href} className="underline-offset-4 transition-colors hover:text-foreground hover:underline">
                    {nav(linkKey[href])}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>{t("rights")}</p>
          <p className="font-heading">{t("tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
