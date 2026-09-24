"use client";

import { MonitorSmartphoneIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { themes } from "@/lib/theme/preference";
import { useTheme } from "./preferences-provider";

const icons = { system: MonitorSmartphoneIcon, light: SunIcon, dark: MoonIcon } as const;

/** Light, dark, or whatever the device uses. */
export function ThemePicker({ labelledBy }: { labelledBy: string }) {
  const t = useTranslations("ThemeToggle");
  const { theme, setTheme } = useTheme();

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={theme}
      onValueChange={(value) => {
        const next = themes.find((option) => option === value);
        if (next) setTheme(next);
      }}
      aria-labelledby={labelledBy}
    >
      {themes.map((option) => {
        const Icon = icons[option];
        return (
          <ToggleGroupItem key={option} value={option} className="gap-2 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            <Icon aria-hidden />
            {t(option)}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
