import { ContentEditPage } from "@/components/admin/builder/content-pages";

export default async function Page({ params }: PageProps<"/[locale]/admin/lessons/[contentId]">) {
  const { contentId } = await params;
  return <ContentEditPage kind="lesson" id={contentId} />;
}
