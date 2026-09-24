import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Providers } from "@/components/shared/providers";
import { SkipLink } from "@/components/shared/skip-link";
import { getDirection, getHtmlLang } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { parseScriptPreference, SCRIPT_COOKIE } from "@/lib/script/preference";
import { getAccount, type Account } from "@/lib/supabase/queries/account";
import { parseThemePreference, THEME_COOKIE } from "@/lib/theme/preference";
import { fontVariables } from "../fonts";
import "../globals.css";

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const common = await getTranslations({ locale, namespace: "Common" });
  return {
    title: { default: t("title"), template: `%s · ${common("appName")}` },
    description: t("description"),
  };
}

async function loadAccount(): Promise<Account | null> {
  try {
    return await getAccount();
  } catch (error) {
    console.error("Could not load the account", error);
    return null;
  }
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const script = parseScriptPreference(cookieStore.get(SCRIPT_COOKIE)?.value);
  const theme = parseThemePreference(cookieStore.get(THEME_COOKIE)?.value);
  const dir = getDirection(locale);
  const account = await loadAccount();

  return (
    <html lang={getHtmlLang(locale)} dir={dir} data-theme={theme} className={fontVariables}>
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>
          <Providers dir={dir} initialScript={script} initialTheme={theme} account={account}>
            <SkipLink />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
