import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProfileView } from "@/components/progress/profile-view";
import { getMapUnits } from "@/lib/supabase/queries/units";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Profile");
  return { title: t("title"), robots: { index: false } };
}

async function loadUnits() {
  try {
    return (await getMapUnits()).map((unit) => ({ id: unit.id, levelIds: unit.levels.map((l) => l.id) }));
  } catch {
    return [];
  }
}

/** Read once per request so the page renders identically on the server and in the browser. */
function requestTime(): number {
  return Date.now();
}

export default async function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ProfileView units={await loadUnits()} now={requestTime()} />
    </div>
  );
}
