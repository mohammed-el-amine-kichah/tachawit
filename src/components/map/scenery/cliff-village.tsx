/** Stone houses stacked on a cliff edge, in the spirit of the Ghoufi balconies. */
export function CliffVillage() {
  return (
    <svg viewBox="0 0 130 150" className="h-full w-full">
      <path d="M0 150 L0 40 L20 30 L44 36 L60 60 L78 64 L96 92 L130 110 L130 150 Z" className="fill-map-mid" />
      <g className="fill-card">
        <rect x="8" y="16" width="26" height="18" rx="1" />
        <rect x="36" y="22" width="20" height="16" rx="1" />
        <rect x="58" y="44" width="22" height="18" rx="1" />
        <rect x="80" y="70" width="18" height="16" rx="1" />
      </g>
      <g className="fill-foreground/60">
        <rect x="14" y="22" width="4" height="6" rx="1" />
        <rect x="24" y="22" width="4" height="6" rx="1" />
        <rect x="43" y="27" width="4" height="6" rx="1" />
        <rect x="65" y="50" width="4" height="6" rx="1" />
        <rect x="86" y="75" width="4" height="6" rx="1" />
      </g>
      <path d="M0 40 L20 30 L44 36 L60 60 L78 64 L96 92 L130 110" className="fill-none stroke-foreground/15" strokeWidth={2} />
    </svg>
  );
}
