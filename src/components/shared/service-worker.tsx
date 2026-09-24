"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/offline/client";

export function ServiceWorker() {
  useEffect(registerServiceWorker, []);
  return null;
}
