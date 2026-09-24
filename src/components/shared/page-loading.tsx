import { useTranslations } from "next-intl";
import { ZMark } from "./z-mark";

/** Shown while a page streams in: the yaz mark breathing, and a spoken label. */
export function PageLoading() {
  const t = useTranslations("Common");
  return (
    <div role="status" className="flex flex-1 items-center justify-center py-24">
      <ZMark className="size-12 animate-pulse text-primary motion-reduce:animate-none" />
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
