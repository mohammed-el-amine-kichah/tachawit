import { useTranslations } from "next-intl";
import { ScriptToggle } from "@/components/shared/script-toggle";
import { ThemePicker } from "@/components/shared/theme-picker";

/** How the app looks for this learner: the script Tachawit is written in, and light or dark. */
export function PreferencesSection() {
  const t = useTranslations("Profile");
  const script = useTranslations("ScriptToggle");
  return (
    <section aria-labelledby="preferences-title" className="flex flex-col gap-5 rounded-3xl bg-card p-5 shadow-soft ring-1 ring-border">
      <h2 id="preferences-title" className="text-xl font-semibold">
        {t("preferences")}
      </h2>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{script("label")}</p>
        <p className="text-sm text-muted-foreground">{t("scriptLead")}</p>
        <ScriptToggle className="self-start" />
      </div>
      <div className="flex flex-col gap-2">
        <p id="theme-label" className="text-sm font-medium">
          {t("theme")}
        </p>
        <ThemePicker labelledBy="theme-label" />
      </div>
    </section>
  );
}
