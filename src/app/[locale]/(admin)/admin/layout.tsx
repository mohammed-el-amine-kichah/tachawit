import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Forbidden } from "@/components/admin/forbidden";
import { Toaster } from "@/components/ui/sonner";
import { getPathname } from "@/i18n/navigation";
import { AdminAccessError, requireAdmin } from "@/lib/admin/guard";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/[locale]/admin">) {
  const locale = await getLocale();
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    if (!(error instanceof AdminAccessError)) throw error;
    if (error.reason === "signed_out") {
      redirect(`${getPathname({ href: "/login", locale })}?next=${encodeURIComponent(getPathname({ href: "/admin", locale }))}`);
    }
    return <Forbidden />;
  }

  const { count } = await admin.supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "pending");

  return (
    <div className="min-h-dvh md:flex">
      <AdminSidebar pendingSubmissions={count ?? 0} />
      <main id="main" className="min-w-0 flex-1 px-4 py-6 md:px-8">
        {children}
      </main>
      <Toaster position="top-center" />
    </div>
  );
}
