import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function LevelStars({ stars, className }: { stars: number; className?: string }) {
  return (
    <span className={cn("flex items-end gap-0.5", className)} aria-hidden>
      {[1, 2, 3].map((n) => (
        <StarIcon
          key={n}
          className={cn(
            "size-4 stroke-[2.5]",
            n === 2 && "size-5",
            n <= stars ? "fill-gold stroke-gold-foreground/40" : "fill-muted stroke-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}
