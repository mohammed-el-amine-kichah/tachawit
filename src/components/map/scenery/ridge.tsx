/** Rolling foothills with a lone juniper. */
export function Ridge() {
  return (
    <svg viewBox="0 0 140 80" className="h-full w-full">
      <path d="M0 80 C20 40 50 36 70 50 C90 30 120 34 140 60 L140 80 Z" className="fill-map-mid" />
      <rect x="92" y="30" width="3" height="16" rx="1.5" className="fill-map-trunk" />
      <circle cx="93.5" cy="28" r="9" className="fill-map-foliage" />
    </svg>
  );
}
