import type { SocialNetwork } from "@/lib/site/social";

// Simplified brand marks drawn in the current text colour (lucide no longer ships brand icons).
export function SocialIcon({ network, className }: { network: SocialNetwork; className?: string }) {
  if (network === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
        <path d="M16.6 2h-3.3v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.2a6.3 6.3 0 1 0 5.3 6.2V8.6a8 8 0 0 0 4.4 1.3V6.6a4.5 4.5 0 0 1-4.4-4.6Z" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {network === "instagram" ? (
        <>
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
          <circle cx="12" cy="12" r="4.2" />
          <path d="M17.5 6.5h.01" />
        </>
      ) : (
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z" />
      )}
    </svg>
  );
}
