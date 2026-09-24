/** A date palm from the oases towards Biskra. */
export function Palm() {
  return (
    <svg viewBox="0 0 90 140" className="h-full w-full">
      <path d="M46 140 C44 110 42 80 48 44" className="fill-none stroke-map-trunk" strokeWidth={7} strokeLinecap="round" />
      <g className="fill-map-foliage">
        <path d="M48 44 C36 30 18 30 4 42 C20 38 34 40 48 46 Z" />
        <path d="M48 44 C60 28 78 28 90 40 C74 36 62 38 48 46 Z" />
        <path d="M48 44 C42 26 30 14 14 12 C28 20 38 30 47 46 Z" />
        <path d="M48 44 C56 24 68 14 84 14 C70 22 60 32 49 46 Z" />
        <path d="M48 44 C50 28 48 14 44 4 C54 16 54 30 50 46 Z" />
      </g>
      <g className="fill-gold">
        <circle cx="44" cy="50" r="3" />
        <circle cx="50" cy="51" r="3" />
      </g>
    </svg>
  );
}
