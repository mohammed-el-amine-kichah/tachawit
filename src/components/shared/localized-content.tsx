import { useLocale } from "next-intl";
import { getDirection, getHtmlLang } from "@/i18n/config";
import { localize, type LocalizedText } from "@/i18n/localize";

/** Renders multilingual database content in the UI locale, marking language and direction on fallback. */
export function LocalizedContent({
  value,
  as: Tag = "span",
  className,
}: {
  value: LocalizedText | null;
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3";
  className?: string;
}) {
  const locale = useLocale();
  const result = localize(value, locale);
  if (!result) return null;

  return (
    <Tag
      className={className}
      lang={result.isFallback ? getHtmlLang(result.locale) : undefined}
      dir={result.isFallback ? getDirection(result.locale) : undefined}
    >
      {result.text}
    </Tag>
  );
}
