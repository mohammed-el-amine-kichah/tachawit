import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { ReviewSession } from "@/components/review/review-session";
import { KeepOffline } from "@/components/shared/keep-offline";
import { freshSeed } from "@/lib/random";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Review");
  return { title: t("title"), robots: { index: false } };
}

/** Clock for "what is due", read once on the server so the page renders the same on both sides. */
function requestTime(): number {
  return Date.now();
}

export default async function ReviewPage({ searchParams }: PageProps<"/[locale]/review">) {
  const { level } = await searchParams;
  const levelId = z.uuid().safeParse(level);
  return (
    <>
      <KeepOffline />
      <ReviewSession levelId={levelId.success ? levelId.data : null} seed={freshSeed()} now={requestTime()} />
    </>
  );
}
