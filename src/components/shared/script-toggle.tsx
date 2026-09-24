"use client";

import { useTranslations } from "next-intl";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { isScript } from "@/lib/script/scripts";
import { cn } from "@/lib/utils";
import { useScript } from "./preferences-provider";

const items = [
  { script: "latin", sample: "sampleLatin", className: "font-sans" },
  { script: "arabic", sample: "sampleArabic", className: "font-arabic" },
  { script: "tifinagh", sample: "sampleTifinagh", className: "font-tifinagh" },
] as const;

export function ScriptToggle({ className }: { className?: string }) {
  const t = useTranslations("ScriptToggle");
  const { script, setScript } = useScript();

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={script}
      onValueChange={(value) => isScript(value) && setScript(value)}
      aria-label={t("label")}
      className={className}
    >
      {items.map((item) => (
        <ToggleGroupItem
          key={item.script}
          value={item.script}
          aria-label={t(item.script)}
          title={t(item.script)}
          className={cn("min-w-11 px-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground", item.className)}
        >
          {t(item.sample)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
