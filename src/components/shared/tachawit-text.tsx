"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { resolveTachawitText, type TachawitTextSource } from "@/lib/script/resolve";
import type { Script } from "@/lib/script/scripts";
import { useScript } from "./preferences-provider";

const scriptClassName: Record<Script, string> = {
  latin: "font-sans",
  arabic: "font-arabic",
  tifinagh: "font-tifinagh tracking-wide",
};

/** The only way Tachawit text is rendered: follows the global script toggle, falls back to Latin. */
export function TachawitText({
  entry,
  as: Tag = "span",
  className,
}: {
  entry: TachawitTextSource;
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3" | "strong";
  className?: string;
}) {
  const { script } = useScript();
  const t = useTranslations("ScriptToggle");
  const resolved = resolveTachawitText(entry, script);

  return (
    <Tag
      lang={resolved.lang}
      dir={resolved.dir}
      data-script={resolved.script}
      data-fallback={resolved.isFallback || undefined}
      title={resolved.isFallback ? t("fallback") : undefined}
      className={cn(scriptClassName[resolved.script], className)}
    >
      {resolved.text}
    </Tag>
  );
}
