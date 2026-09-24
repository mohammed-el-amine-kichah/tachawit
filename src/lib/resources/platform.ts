import type { ResourcePlatform } from "@/lib/content/enums";

// Hosts each platform serves links from (the domain itself and any subdomain, e.g. m. or vm.).
const platformHosts: Record<ResourcePlatform, readonly string[]> = {
  youtube: ["youtube.com", "youtu.be"],
  tiktok: ["tiktok.com"],
  facebook: ["facebook.com", "fb.com", "fb.watch"],
  instagram: ["instagram.com"],
};

/**
 * The platform an https link points to, or null for anything else (other sites, http, javascript:).
 * Plain https links are what phones hand over to the installed app, so no custom schemes are needed.
 */
export function platformOfUrl(value: string): ResourcePlatform | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  for (const [platform, hosts] of Object.entries(platformHosts) as [ResourcePlatform, readonly string[]][]) {
    if (hosts.some((domain) => host === domain || host.endsWith(`.${domain}`))) return platform;
  }
  return null;
}

export function isPlatformUrl(platform: ResourcePlatform, value: string): boolean {
  return platformOfUrl(value) === platform;
}
