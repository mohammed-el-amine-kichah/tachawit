import {
  AudioLinesIcon,
  BookAIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  MicIcon,
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
  { section: "regions", href: "/admin/regions", icon: MapPinIcon },
  { section: "users", href: "/admin/users", icon: UsersIcon },
];
