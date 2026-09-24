import type { MetadataRoute } from "next";
import { sitemapEntries } from "@/lib/seo/sitemap";
import { siteOrigin } from "@/lib/site-url";
import { getCultureList } from "@/lib/supabase/queries/culture";

export const revalidate = 3600;

async function cultureSlugs(): Promise<string[]> {
  try {
    return (await getCultureList()).map((article) => article.slug);
  } catch (error) {
    console.error("Could not list culture articles for the sitemap", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapEntries(await siteOrigin(), await cultureSlugs());
}
