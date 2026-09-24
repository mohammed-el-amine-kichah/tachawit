import { cn } from "@/lib/utils";

/** The learner, standing on the current level: a figure in a Chaoui headscarf with a silver fibula. */
export function MapAvatar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 52" className={cn("h-13 w-10 drop-shadow-md", className)} aria-hidden>
      <ellipse cx="20" cy="50" rx="11" ry="2.5" className="fill-shade" />
      <path d="M8 48 C8 34 12 28 20 28 C28 28 32 34 32 48 Z" className="fill-secondary" />
      <path d="M12 48 L14 38 L26 38 L28 48 Z" className="fill-primary opacity-80" />
      <path d="M17 32 L23 32 L20 37 Z" className="fill-silver" />
      <circle cx="20" cy="36.5" r="1.4" className="fill-gold" />
      <circle cx="20" cy="18" r="8" className="fill-accent" />
      <path d="M11 19 C11 9 29 9 29 19 C29 16 26 12 20 12 C14 12 11 16 11 19 Z" className="fill-primary" />
      <path d="M11 19 C10 24 12 29 15 30 L13 20 Z M29 19 C30 24 28 29 25 30 L27 20 Z" className="fill-primary" />
      <circle cx="17" cy="19" r="1" className="fill-foreground" />
      <circle cx="23" cy="19" r="1" className="fill-foreground" />
    </svg>
  );
}
