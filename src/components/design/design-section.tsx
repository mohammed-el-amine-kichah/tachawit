import type { ReactNode } from "react";

export function DesignSection({ id, title, lead, children }: { id: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t py-10 first:border-t-0">
      <h2 id={id} className="text-2xl font-semibold">
        {title}
      </h2>
      {lead ? <p className="mt-2 max-w-2xl text-muted-foreground">{lead}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
