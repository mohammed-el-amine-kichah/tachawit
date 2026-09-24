/** An Atlas cedar, with its flat, layered branches. */
export function Cedar() {
  return (
    <svg viewBox="0 0 90 130" className="h-full w-full">
      <rect x="42" y="60" width="7" height="68" rx="3" className="fill-map-trunk" />
      <path d="M45 8 C52 16 60 22 66 26 L24 26 C30 22 38 16 45 8 Z" className="fill-map-foliage" />
      <path d="M45 24 C58 34 74 40 84 48 L6 48 C16 40 32 34 45 24 Z" className="fill-map-foliage" />
      <path d="M45 46 C60 56 78 62 90 72 L0 72 C12 62 30 56 45 46 Z" className="fill-map-foliage" />
      <path d="M45 46 C60 56 78 62 90 72 L45 72 Z" className="fill-foreground/10" />
    </svg>
  );
}
