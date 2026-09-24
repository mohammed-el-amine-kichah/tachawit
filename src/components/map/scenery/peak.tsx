/** A snow-capped Aurès summit. */
export function Peak() {
  return (
    <svg viewBox="0 0 140 100" className="h-full w-full">
      <path d="M0 100 L42 30 L58 48 L84 10 L140 100 Z" className="fill-map-far" />
      <path d="M84 10 L72 30 L79 26 L85 34 L91 26 L97 31 Z" className="fill-card" />
      <path d="M42 30 L35 42 L42 38 L48 42 Z" className="fill-card opacity-80" />
      <path d="M84 10 L140 100 L104 100 L92 60 Z" className="fill-foreground/10" />
    </svg>
  );
}
