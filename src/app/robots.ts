import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await siteOrigin();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/*/admin", "/*/profile", "/*/login", "/*/level/", "/*/review", "/*/preview/"] },
    sitemap: `${origin}/sitemap.xml`,
  };
}
