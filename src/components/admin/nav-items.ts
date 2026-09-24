import {
  AudioLinesIcon,
  BookAIcon,
  BookOpenIcon,
  InboxIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  MapIcon,
  MapPinIcon,
  MicIcon,
  SparklesIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

export type AdminSection =
  | "dashboard" | "entries" | "audio" | "speakers" | "regions" | "units" | "lessons" | "quizzes" | "submissions" | "culture" | "resources" | "users";

export const adminNav: { section: AdminSection; href: string; icon: LucideIcon }[] = [
  { section: "dashboard", href: "/admin", icon: LayoutDashboardIcon },
  { section: "entries", href: "/admin/entries", icon: BookAIcon },
  { section: "audio", href: "/admin/audio", icon: AudioLinesIcon },
  { section: "speakers", href: "/admin/speakers", icon: MicIcon },
  { section: "units", href: "/admin/units", icon: MapIcon },
  { section: "lessons", href: "/admin/lessons", icon: BookOpenIcon },
  { section: "quizzes", href: "/admin/quizzes", icon: SparklesIcon },
  { section: "regions", href: "/admin/regions", icon: MapPinIcon },
  { section: "submissions", href: "/admin/submissions", icon: InboxIcon },
  { section: "culture", href: "/admin/culture", icon: LandmarkIcon },
  { section: "resources", href: "/admin/resources", icon: LibraryIcon },
  { section: "users", href: "/admin/users", icon: UsersIcon },
];
