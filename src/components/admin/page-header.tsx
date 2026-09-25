import { ArrowLeftIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** The list this page belongs to, shown as a link above the title. */
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      {back && (
        <Link href={back.href} className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon aria-hidden className="size-4 rtl:-scale-x-100" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-sans text-2xl font-bold">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
