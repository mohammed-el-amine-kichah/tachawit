import { ExternalLinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocalizedContent } from "@/components/shared/localized-content";
import { SocialIcon } from "@/components/shared/social-icon";
import type { Resource } from "@/lib/supabase/queries/resources";

/** A plain https link: phones open it in the platform's app when it is installed, the browser otherwise. */
export function ResourceCard({ resource }: { resource: Resource }) {
  const t = useTranslations("Resources");
  const platform = t(`platforms.${resource.platform}`);
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("open", { name: resource.name, platform })}
      className="group flex h-full flex-col gap-3 rounded-3xl bg-card p-5 shadow-soft ring-1 ring-border transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <SocialIcon network={resource.platform} className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-primary uppercase ltr:tracking-wider">{platform}</span>
          <span className="block text-lg leading-snug font-semibold break-words group-hover:underline">{resource.name}</span>
        </span>
        <ExternalLinkIcon aria-hidden className="size-4 shrink-0 text-muted-foreground rtl:-scale-x-100" />
      </div>
      <LocalizedContent value={resource.summary} as="p" className="text-sm text-muted-foreground" />
    </a>
  );
}
