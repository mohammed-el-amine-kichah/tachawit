import { cn } from "@/lib/utils";

const variants = {
  band: "motif-band h-4",
  zigzag: "motif-zigzag h-2",
  weave: "motif-weave opacity-10",
} as const;

/** Decorative Amazigh motif. Purely visual, hidden from assistive technology. */
export function Motif({ variant = "band", className }: { variant?: keyof typeof variants; className?: string }) {
  return <div aria-hidden className={cn("w-full", variants[variant], className)} />;
}
