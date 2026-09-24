import { ContentEditPage } from "@/components/admin/builder/content-pages";

export default async function Page({ params }: PageProps<"/[locale]/admin/quizzes/[contentId]">) {
  const { contentId } = await params;
  return <ContentEditPage kind="quiz" id={contentId} />;
}
