import { HandHeartIcon, LandmarkIcon, MapIcon, RotateCcwIcon, UserRoundIcon, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: "/" | "/review" | "/culture" | "/contribute" | "/profile";
  key: "journey" | "review" | "culture" | "contribute" | "profile";
  icon: LucideIcon;
};

/** Main destinations, shared by the header (desktop) and the bottom bar (phones). */
export const navItems: NavItem[] = [
  { href: "/", key: "journey", icon: MapIcon },
  { href: "/review", key: "review", icon: RotateCcwIcon },
  { href: "/culture", key: "culture", icon: LandmarkIcon },
  { href: "/contribute", key: "contribute", icon: HandHeartIcon },
  { href: "/profile", key: "profile", icon: UserRoundIcon },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
