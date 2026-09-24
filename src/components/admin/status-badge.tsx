import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: "draft" | "published"; className?: string }) {
  const t = useTranslations("Admin.status");
  return (
    <Badge variant={status === "published" ? "default" : "outline"} className={cn(status === "published" && "bg-success text-success-foreground", className)}>
      {t(status)}
    </Badge>
  );
}
