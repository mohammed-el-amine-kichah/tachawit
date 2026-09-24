import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A calm, non-alarming message for empty or unavailable states. */
export function Notice({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p role="status" className={cn("rounded-xl border border-dashed bg-card/60 px-4 py-6 text-center text-muted-foreground", className)}>
      {children}
    </p>
  );
}
