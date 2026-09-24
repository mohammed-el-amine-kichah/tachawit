import type { MetadataRoute } from "next";
import arabic from "@/messages/ar.json";

// Colours mirror the design tokens (sand-50 background, terracotta-500 primary); a manifest cannot
// read CSS variables.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: arabic.Common.appName,
    short_name: arabic.Common.appName,
    description: arabic.Metadata.description,
    lang: "ar",
    dir: "auto",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fcf9f4",
    theme_color: "#fcf9f4",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
