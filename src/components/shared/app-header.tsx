import { Brand } from "./brand";
import { HeaderNav } from "./header-nav";
import { LocaleSwitcher } from "./locale-switcher";
import { ProfileLink } from "./profile-link";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
        <Brand />
        <HeaderNav />
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ProfileLink />
        </div>
      </div>
    </header>
  );
}
