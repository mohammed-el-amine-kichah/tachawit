import { cn } from "@/lib/utils";

/** The Tifinagh letter yaz (ⵣ), drawn as strokes so it never depends on a font. */
export const zMarkPaths = [
  "M12 2.5V21.5",
  "M5.5 3C5.5 7.5 8 9.5 12 9.5C16 9.5 18.5 7.5 18.5 3",
  "M5.5 21C5.5 16.5 8 14.5 12 14.5C16 14.5 18.5 16.5 18.5 21",
] as const;

export function ZMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-6", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {zMarkPaths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
