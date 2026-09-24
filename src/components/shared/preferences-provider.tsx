"use client";

import { createContext, use, useCallback, useMemo, useState, type ReactNode } from "react";
import { writePreferenceCookie } from "@/lib/cookies";
import { SCRIPT_COOKIE } from "@/lib/script/preference";
import type { Script } from "@/lib/script/scripts";
import { THEME_COOKIE, type Theme } from "@/lib/theme/preference";

type Preferences = {
  script: Script;
  setScript: (script: Script) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const PreferencesContext = createContext<Preferences | null>(null);

export function PreferencesProvider({
  initialScript,
  initialTheme,
  children,
}: {
  initialScript: Script;
  initialTheme: Theme;
  children: ReactNode;
}) {
  const [script, setScriptState] = useState(initialScript);
  const [theme, setThemeState] = useState(initialTheme);

  const setScript = useCallback((next: Script) => {
    setScriptState(next);
    writePreferenceCookie(SCRIPT_COOKIE, next);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    writePreferenceCookie(THEME_COOKIE, next);
  }, []);

  const value = useMemo(() => ({ script, setScript, theme, setTheme }), [script, setScript, theme, setTheme]);

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}

function usePreferences(): Preferences {
  const preferences = use(PreferencesContext);
  if (!preferences) throw new Error("usePreferences must be used inside <PreferencesProvider>");
  return preferences;
}

export function useScript() {
  const { script, setScript } = usePreferences();
  return { script, setScript };
}

export function useTheme() {
  const { theme, setTheme } = usePreferences();
  return { theme, setTheme };
}
