import { ArrowLeftIcon, MapIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { MarkdownView } from "@/components/culture/markdown-view";
import { LocalizedContent } from "@/components/shared/localized-content";
import { Motif } from "@/components/shared/motif";
import { getContentFallbacks, getContentKey, getDirection, getHtmlLang } from "@/i18n/config";
import { localize } from "@/i18n/localize";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getCultureArticle } from "@/lib/supabase/queries/culture";
import { getPublicStorageUrl } from "@/lib/supabase/storage";

export async function generateMetadata({ params }: PageProps<"/[locale]/culture/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const note = await getCultureArticle(slug);
  if (!note || !hasLocale(routing.locales, locale)) return {};
  return { title: localize(note.title, locale)?.text, description: localize(note.summary, locale)?.text };
}

export default async function CultureArticlePage({ params }: PageProps<"/[locale]/culture/[slug]">) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const note = await getCultureArticle(slug);
  if (!note) notFound();
  const t = await getTranslations("Culture");

  // The body in the reader's language, or the closest available one, marked with its language.
  const bodyLocale = getContentFallbacks(locale).find((l) => note.body[getContentKey(l)]?.trim());
  const cover = note.coverPath ? getPublicStorageUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!, "images", note.coverPath) : null;

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/culture" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon aria-hidden className="size-4 rtl:-scale-x-100" />
        {t("back")}
      </Link>
      <p className="mt-6 text-sm font-semibold text-primary uppercase ltr:tracking-wider">{t(`categories.${note.category}`)}</p>
      <LocalizedContent value={note.title} as="h1" className="mt-1 font-heading text-4xl leading-tight font-semibold sm:text-5xl" />
      <LocalizedContent value={note.summary} as="p" className="mt-3 text-xl text-muted-foreground" />
      {note.unit && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground">
          <MapIcon aria-hidden className="size-4" />
          {t("fromUnit")} <LocalizedContent value={note.unit.title} className="font-semibold" />
        </p>
      )}
      <Motif variant="band" className="my-8" />
      {cover && (
        <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-3xl bg-muted">
          <Image src={cover} alt="" fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
      )}
      {bodyLocale ? (
        <div lang={getHtmlLang(bodyLocale)} dir={getDirection(bodyLocale)}>
          <MarkdownView source={note.body[getContentKey(bodyLocale)]!} />
        </div>
      ) : (
        <p className="text-muted-foreground">{t("noBody")}</p>
      )}
    </article>
  );
}
