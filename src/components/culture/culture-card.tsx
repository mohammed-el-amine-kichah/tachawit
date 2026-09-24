import Image from "next/image";
import { useTranslations } from "next-intl";
import { LocalizedContent } from "@/components/shared/localized-content";
import { Motif } from "@/components/shared/motif";
import { Link } from "@/i18n/navigation";
import type { CultureCard as Card } from "@/lib/supabase/queries/culture";
import { getPublicStorageUrl } from "@/lib/supabase/storage";

export function CultureCard({ note }: { note: Card }) {
  const t = useTranslations("Culture.categories");
  const cover = note.coverPath ? getPublicStorageUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!, "images", note.coverPath) : null;
  return (
    <Link href={`/culture/${note.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-soft ring-1 ring-border transition-transform duration-150 hover:-translate-y-0.5">
      {cover ? (
        <div className="relative aspect-[16/9] bg-muted">
          <Image src={cover} alt="" fill sizes="(max-width: 640px) 100vw, 400px" className="object-cover" />
        </div>
      ) : (
        <div className="relative grid aspect-[16/9] place-items-center overflow-hidden bg-accent">
          <Motif variant="weave" className="absolute inset-0 h-full opacity-30" />
          <Motif variant="band" className="relative h-5 w-2/3" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-xs font-semibold text-primary uppercase ltr:tracking-wider">{t(note.category)}</p>
        <LocalizedContent value={note.title} as="h3" className="text-xl leading-snug font-semibold group-hover:underline" />
        <LocalizedContent value={note.summary} as="p" className="text-sm text-muted-foreground" />
      </div>
    </Link>
  );
}
