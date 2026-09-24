import { AppFooter } from "@/components/shared/app-footer";
import { AppHeader } from "@/components/shared/app-header";

export default function SiteLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <>
      <AppHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <AppFooter />
    </>
  );
}
