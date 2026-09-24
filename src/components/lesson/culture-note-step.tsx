import { ArrowUpRightIcon, LandmarkIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { LocalizedContent } from "@/components/shared/localized-content";
import { Motif } from "@/components/shared/motif";
import { Link } from "@/i18n/navigation";
import type { LocalizedText } from "@/lib/content/localized-text";
import { StepLabel } from "./step-label";

export function CultureNoteStep({
  title,
  body,
  imageUrl,
  noteSlug,
}: {
  title: LocalizedText | null;
  body: LocalizedText | null;
  imageUrl: string | null;
  noteSlug: string | null;
}) {
  const t = useTranslations("Lesson");
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <StepLabel icon={LandmarkIcon}>{t("culture")}</StepLabel>
      <article className="w-full overflow-hidden rounded-3xl bg-card text-start shadow-soft ring-1 ring-border">
        {imageUrl ? (
          <div className="relative aspect-[16/9]">
            <Image src={imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 512px" className="object-cover" />
          </div>
        ) : (
          <Motif variant="band" className="h-4" />
        )}
        <div className="space-y-3 p-5">
          <LocalizedContent value={title} as="h2" className="text-2xl font-semibold" />
          <LocalizedContent value={body} as="p" className="text-lg leading-relaxed whitespace-pre-line" />
          {noteSlug && (
            <Link href={`/culture/${noteSlug}`} className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline">
              {t("readMore")}
              <ArrowUpRightIcon aria-hidden className="size-4 rtl:-scale-x-100" />
            </Link>
          )}
        </div>
      </article>
    </div>
  );
}
