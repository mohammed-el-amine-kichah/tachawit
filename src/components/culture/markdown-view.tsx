import Image from "next/image";
import { Fragment, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { parseMarkdown, type Inline } from "@/lib/culture/markdown";
import { getPublicStorageUrl } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

function inline(nodes: Inline[]): ReactNode {
  return nodes.map((node, i) => {
    switch (node.type) {
      case "text":
        return <Fragment key={i}>{node.text}</Fragment>;
      case "strong":
        return <strong key={i}>{inline(node.children)}</strong>;
      case "em":
        return <em key={i}>{inline(node.children)}</em>;
      case "link":
        return node.href.startsWith("/") ? (
          <Link key={i} href={node.href} className="font-medium text-primary underline underline-offset-2">
            {inline(node.children)}
          </Link>
        ) : (
          <a key={i} href={node.href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">
            {inline(node.children)}
          </a>
        );
    }
  });
}

/** Safe rendering of an article body: the Markdown subset becomes React elements, never raw HTML. */
export function MarkdownView({ source, className }: { source: string; className?: string }) {
  const blocks = parseMarkdown(source);
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return (
    <div className={cn("flex flex-col gap-5 text-lg leading-relaxed", className)}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return block.level === 2 ? (
              <h2 key={i} className="mt-4 text-2xl font-semibold">
                {inline(block.children)}
              </h2>
            ) : (
              <h3 key={i} className="mt-2 text-xl font-semibold">
                {inline(block.children)}
              </h3>
            );
          case "paragraph":
            return <p key={i}>{inline(block.children)}</p>;
          case "quote":
            return (
              <blockquote key={i} className="border-s-4 border-gold ps-4 text-muted-foreground italic">
                {inline(block.children)}
              </blockquote>
            );
          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <List key={i} className={cn("flex flex-col gap-1 ps-6", block.ordered ? "list-decimal" : "list-disc marker:text-primary")}>
                {block.items.map((item, j) => (
                  <li key={j}>{inline(item)}</li>
                ))}
              </List>
            );
          }
          case "image": {
            const src = block.src.startsWith("https://") ? block.src : getPublicStorageUrl(storageUrl, "images", block.src);
            return (
              <figure key={i} className="flex flex-col gap-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
                  <Image src={src} alt={block.alt} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
                </div>
                {block.alt && <figcaption className="text-center text-sm text-muted-foreground">{block.alt}</figcaption>}
              </figure>
            );
          }
        }
      })}
    </div>
  );
}
