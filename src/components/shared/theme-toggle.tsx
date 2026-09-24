"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useTheme } from "./preferences-provider";

/**
 * One tap between light and dark: a sun in light mode, a crescent in dark mode. Until the visitor
 * picks, the theme follows the device; the icons use the `dark:` variant, which covers that case
 * too, so server and browser render the same markup.
 */
export function ThemeToggle() {
  const t = useTranslations("ThemeToggle");
  const { theme, setTheme } = useTheme();

  const toggle = () => {
    const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setTheme(dark ? "light" : "dark");
  };

  return (
    <Button variant="ghost" size="icon-lg" onClick={toggle} aria-label={t("toggle")} title={t("toggle")}>
      <SunIcon aria-hidden className="dark:hidden" />
      <MoonIcon aria-hidden className="hidden dark:block" />
    </Button>
  );
}
