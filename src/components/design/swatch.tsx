import { cn } from "@/lib/utils";

export function Swatch({ label, token, className }: { label: string; token: string; className: string }) {
  return (
    <li className="flex items-center gap-3">
      <span aria-hidden className={cn("size-12 shrink-0 rounded-xl ring-1 ring-foreground/10", className)} />
      <span className="flex flex-col">
        <span className="font-medium">{label}</span>
        <code className="text-xs text-muted-foreground" dir="ltr">
          {token}
        </code>
      </span>
    </li>
  );
}
