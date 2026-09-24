"use client";

import { createContext, use } from "react";
import type { AccountUser } from "@/lib/supabase/queries/account";

export const AccountContext = createContext<AccountUser | null>(null);

/** The signed-in user, or null for guests. */
export function useAccount(): AccountUser | null {
  return use(AccountContext);
}
