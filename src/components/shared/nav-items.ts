import { HandHeartIcon, LandmarkIcon, LibraryIcon, MapIcon, RotateCcwIcon, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: "/" | "/review" | "/culture" | "/resources" | "/contribute";
  key: "journey" | "review" | "culture" | "resources" | "contribute";
  icon: LucideIcon;
};

/** Main destinations, shared by the header (desktop) and the bottom bar (phones). The profile sits apart, at the end of the header. */
export const navItems: NavItem[] = [
  { href: "/", key: "journey", icon: MapIcon },
  { href: "/review", key: "review", icon: RotateCcwIcon },
  { href: "/culture", key: "culture", icon: LandmarkIcon },
  { href: "/resources", key: "resources", icon: LibraryIcon },
  { href: "/contribute", key: "contribute", icon: HandHeartIcon },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
