"use client";

import { createContext, use } from "react";
import type { Glossary } from "@/lib/lesson/view";

/** Single-word meanings for tap-a-word, shared by every step of a lesson or quiz. */
export const GlossaryContext = createContext<Glossary>({});

export function useGlossary(): Glossary {
  return use(GlossaryContext);
}
