import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
const supabaseIsLocal = supabase !== null && ["127.0.0.1", "localhost"].includes(supabase.hostname);

const nextConfig: NextConfig = {
  // ffmpeg is a native binary: keep it out of the bundle and ship it with the audio route.
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: {
    "/api/admin/audio": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
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
