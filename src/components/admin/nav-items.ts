import {
  AudioLinesIcon,
  BookAIcon,
  BookOpenIcon,
  LayoutDashboardIcon,
  MapIcon,
  MapPinIcon,
  MicIcon,
  SparklesIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

export type AdminSection =
  | "dashboard" | "entries" | "audio" | "speakers" | "regions" | "units" | "lessons" | "quizzes" | "submissions" | "culture" | "users";

export const adminNav: { section: AdminSection; href: string; icon: LucideIcon }[] = [
  { section: "dashboard", href: "/admin", icon: LayoutDashboardIcon },
  { section: "entries", href: "/admin/entries", icon: BookAIcon },
  { section: "audio", href: "/admin/audio", icon: AudioLinesIcon },
  { section: "speakers", href: "/admin/speakers", icon: MicIcon },
  { section: "units", href: "/admin/units", icon: MapIcon },
  { section: "lessons", href: "/admin/lessons", icon: BookOpenIcon },
  { section: "quizzes", href: "/admin/quizzes", icon: SparklesIcon },
  { section: "regions", href: "/admin/regions", icon: MapPinIcon },
  { section: "users", href: "/admin/users", icon: UsersIcon },
];
