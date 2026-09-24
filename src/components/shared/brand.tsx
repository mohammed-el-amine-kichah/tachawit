import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ZMark } from "./z-mark";

export function Brand() {
  const t = useTranslations("Common");
  return (
    <Link href="/" className="group flex items-center gap-2 rounded-md">
      <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground transition-transform duration-150 group-active:scale-95">
        <ZMark className="size-5" />
      </span>
      <span className="font-heading text-xl font-semibold tracking-tight">{t("appName")}</span>
    </Link>
  );
}
