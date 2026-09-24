"use client";

import { createContext, use } from "react";

/** Steps and questions play their audio on arrival, except in admin previews. */
export const AutoplayContext = createContext(true);

export function useAutoplay(): boolean {
  return use(AutoplayContext);
}
