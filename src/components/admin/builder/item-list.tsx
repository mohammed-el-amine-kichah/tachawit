"use client";

import { AlertCircleIcon, ArrowDownIcon, ArrowUpIcon, GripVerticalIcon, Trash2Icon } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { DraftItem, ItemIssue } from "@/lib/admin/builder";
import { moveItem } from "@/lib/admin/builder";
import { cn } from "@/lib/utils";

function Row({
  item,
  index,
  count,
  label,
  summary,
  issue,
  selected,
  onSelect,
  onMove,
  onRemove,
}: {
  item: DraftItem;
  index: number;
  count: number;
  label: string;
  summary: string;
  issue: ItemIssue | undefined;
  selected: boolean;
  onSelect: () => void;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("Admin.builder");
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className={cn("flex items-center gap-2 rounded-xl bg-card p-2 ring-1 ring-border", selected && "ring-2 ring-primary")}
    >
      <button
        type="button"
        aria-label={t("drag")}
        onPointerDown={(event) => controls.start(event)}
        className="cursor-grab touch-none rounded p-1 text-muted-foreground active:cursor-grabbing"
      >
        <GripVerticalIcon aria-hidden className="size-4" />
      </button>
      <button type="button" onClick={onSelect} aria-current={selected || undefined} className="flex min-w-0 flex-1 items-center gap-2 text-start">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">{index + 1}</span>
        <span className="min-w-0">
          <span className="block text-sm font-medium">{label}</span>
          <span className="block truncate text-xs text-muted-foreground" dir="auto">
            {summary}
          </span>
        </span>
        {issue && (
          <span className="ms-auto shrink-0 text-gold-foreground" title={t(`issues.${issue}`)}>
            <AlertCircleIcon aria-label={t(`issues.${issue}`)} className="size-4 text-destructive" />
          </span>
        )}
      </button>
      <div className="flex shrink-0">
        <Button type="button" variant="ghost" size="icon-sm" aria-label={t("moveUp")} disabled={index === 0} onClick={() => onMove(index - 1)}>
          <ArrowUpIcon aria-hidden />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={t("moveDown")} disabled={index === count - 1} onClick={() => onMove(index + 1)}>
          <ArrowDownIcon aria-hidden />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={t("removeItem")} onClick={onRemove}>
          <Trash2Icon aria-hidden />
        </Button>
      </div>
    </Reorder.Item>
  );
}

/** Steps or questions in order: drag by the handle, or use the arrow buttons from the keyboard. */
export function ItemList({
  items,
  selectedId,
  issues,
  labelOf,
  summaryOf,
  onReorder,
  onSelect,
  onRemove,
}: {
  items: DraftItem[];
  selectedId: string | null;
  issues: Record<string, ItemIssue>;
  labelOf: (item: DraftItem) => string;
  summaryOf: (item: DraftItem) => string;
  onReorder: (items: DraftItem[]) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Reorder.Group axis="y" values={items} onReorder={onReorder} className="flex flex-col gap-2">
      {items.map((item, index) => (
        <Row
          key={item.id}
          item={item}
          index={index}
          count={items.length}
          label={labelOf(item)}
          summary={summaryOf(item)}
          issue={issues[item.id]}
          selected={item.id === selectedId}
          onSelect={() => onSelect(item.id)}
          onMove={(to) => onReorder(moveItem(items, index, to))}
          onRemove={() => onRemove(item.id)}
        />
      ))}
    </Reorder.Group>
  );
}
