import { AppFooter } from "@/components/shared/app-footer";
import { AppHeader } from "@/components/shared/app-header";
import { BottomNav } from "@/components/shared/bottom-nav";
import { OfflineBanner } from "@/components/shared/offline-banner";

export default function SiteLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <>
      <AppHeader />
      <OfflineBanner />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <AppFooter />
      <BottomNav />
    </>
  );
}
