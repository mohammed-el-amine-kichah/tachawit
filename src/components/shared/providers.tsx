"use client";

import { MotionConfig } from "motion/react";
import { Direction } from "radix-ui";
import type { ReactNode } from "react";
import { AccountContext } from "@/components/auth/account-context";
import { ProgressProvider } from "@/components/progress/progress-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Direction as TextDirection } from "@/i18n/config";
import type { Script } from "@/lib/script/scripts";
import type { Account } from "@/lib/supabase/queries/account";
import type { Theme } from "@/lib/theme/preference";
import { PreferencesProvider } from "./preferences-provider";
import { ServiceWorker } from "./service-worker";

export function Providers({
  dir,
  initialScript,
  initialTheme,
  account,
  children,
}: {
  dir: TextDirection;
  account: Account | null;
  initialScript: Script;
  initialTheme: Theme;
  children: ReactNode;
}) {
  return (
    <Direction.Provider dir={dir}>
      <ServiceWorker />
      <MotionConfig reducedMotion="user">
        <TooltipProvider delayDuration={300}>
          <PreferencesProvider initialScript={initialScript} initialTheme={initialTheme}>
            <AccountContext value={account?.user ?? null}>
              <ProgressProvider
                key={account?.user.id ?? "guest"}
                account={account ? { userId: account.user.id, snapshot: account.snapshot } : null}
              >
                {children}
              </ProgressProvider>
            </AccountContext>
          </PreferencesProvider>
        </TooltipProvider>
      </MotionConfig>
    </Direction.Provider>
  );
}
