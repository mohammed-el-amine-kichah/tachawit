"use client";

import { useEffect } from "react";
import { keepForOffline } from "@/lib/offline/client";

/** Asks the service worker to keep this page, and its audio, for offline use. */
export function KeepOffline({ audio = [] }: { audio?: string[] }) {
  const key = audio.join("\n");
  useEffect(() => {
    keepForOffline(key ? key.split("\n") : []);
  }, [key]);
  return null;
}
