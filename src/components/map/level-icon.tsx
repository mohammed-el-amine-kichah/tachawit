import { BookOpenIcon, CrownIcon, LockIcon, MessagesSquareIcon, RotateCcwIcon, SparklesIcon, type LucideIcon } from "lucide-react";
import type { LevelType } from "@/lib/supabase/queries/units";

const icons: Record<LevelType, LucideIcon> = {
  lesson: BookOpenIcon,
  quiz: SparklesIcon,
  review: RotateCcwIcon,
  boss: CrownIcon,
  story: MessagesSquareIcon,
};

export function LevelIcon({ type, locked, className }: { type: LevelType; locked?: boolean; className?: string }) {
  const Icon = locked ? LockIcon : icons[type];
  return <Icon aria-hidden className={className} />;
}
