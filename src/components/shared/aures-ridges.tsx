import { cn } from "@/lib/utils";

/** Layered silhouettes of the Aurès ridges, used as a decorative horizon. */
export function AuresRidges({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 120"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("pointer-events-none block h-24 w-full sm:h-32", className)}
    >
      <path
        d="M0 70 L40 42 L70 58 L115 20 L150 50 L190 30 L230 60 L270 26 L310 52 L350 34 L400 58 V120 H0 Z"
        className="fill-secondary/25"
      />
      <path
        d="M0 88 L30 74 L64 86 L100 60 L140 84 L182 66 L220 88 L262 62 L300 86 L344 70 L400 90 V120 H0 Z"
        className="fill-primary/35"
      />
      <path d="M0 104 L50 94 L110 106 L170 92 L240 106 L300 96 L360 106 L400 98 V120 H0 Z" className="fill-background" />
    </svg>
  );
}
