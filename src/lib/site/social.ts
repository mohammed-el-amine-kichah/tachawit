export type SocialNetwork = "instagram" | "facebook" | "tiktok";

/**
 * Tachawit's social accounts, shown in the footer.
 * TODO: the accounts don't exist yet. Replace each href with the real profile address once created.
 */
export const socialLinks: readonly { network: SocialNetwork; href: string }[] = [
  { network: "instagram", href: "https://www.instagram.com/" }, // TODO: real Instagram profile
  { network: "facebook", href: "https://www.facebook.com/" }, // TODO: real Facebook page
  { network: "tiktok", href: "https://www.tiktok.com/" }, // TODO: real TikTok profile
];
