"use client";

import { MotionConfig } from "motion/react";
import { Direction } from "radix-ui";
import type { ReactNode } from "react";
import { ProgressProvider } from "@/components/progress/progress-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Direction as TextDirection } from "@/i18n/config";
import type { Script } from "@/lib/script/scripts";
import type { Theme } from "@/lib/theme/preference";
import { PreferencesProvider } from "./preferences-provider";

export function Providers({
  dir,
  initialScript,
  initialTheme,
  children,
}: {
  dir: TextDirection;
  initialScript: Script;
  initialTheme: Theme;
  children: ReactNode;
}) {
  return (
    <Direction.Provider dir={dir}>
      <MotionConfig reducedMotion="user">
        <TooltipProvider delayDuration={300}>
          <PreferencesProvider initialScript={initialScript} initialTheme={initialTheme}>
            <ProgressProvider>{children}</ProgressProvider>
          </PreferencesProvider>
        </TooltipProvider>
      </MotionConfig>
    </Direction.Provider>
  );
}
