import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
const supabaseIsLocal = supabase !== null && ["127.0.0.1", "localhost"].includes(supabase.hostname);

// Headers for every response; the Content-Security-Policy is added per request in src/proxy.ts
// because it carries a fresh nonce.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // The service worker must never be served stale, or fixes would not reach installed apps.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          // The worker itself fetches audio from Supabase to keep it for offline use.
          { key: "Content-Security-Policy", value: `default-src 'self'; script-src 'self'; connect-src 'self' ${supabase?.origin ?? ""}`.trim() },
        ],
      },
    ];
  },
  // ffmpeg is a native binary: keep it out of the bundle. Tracing ships it with the routes that
  // convert audio, through its real .pnpm path. Don't add an outputFileTracingIncludes entry for it:
  // pnpm's node_modules/ffmpeg-static is a symlink, and Vercel rejects files under symlinked folders.
  serverExternalPackages: ["ffmpeg-static"],
  experimental: {
    // Contributions can include a short voice recording (up to 8 MB).
    serverActions: { bodySizeLimit: "9mb" },
  },
  images: {
    remotePatterns: supabase
      ? [
          {
            protocol: supabase.protocol === "https:" ? "https" : "http",
            hostname: supabase.hostname,
            port: supabase.port,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    // Only for a local Supabase during development; hosted projects keep the SSRF protection.
    dangerouslyAllowLocalIP: supabaseIsLocal,
  },
};

export default withNextIntl(nextConfig);
