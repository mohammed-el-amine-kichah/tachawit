import type { LucideIcon } from "lucide-react";

export function StepLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
      <Icon aria-hidden className="size-4" />
      {children}
    </p>
  );
}
