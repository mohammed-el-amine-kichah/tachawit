import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Full-width, tactile primary action for players. */
export function BigButton({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      size="lg"
      className={cn(
        "h-14 flex-1 rounded-2xl border-b-[5px] border-shade text-lg font-semibold active:translate-y-0.5 active:border-b-2",
        className,
      )}
      {...props}
    />
  );
}
