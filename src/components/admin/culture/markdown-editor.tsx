"use client";

import { BoldIcon, EyeIcon, Heading2Icon, Heading3Icon, ImagePlusIcon, ItalicIcon, LinkIcon, ListIcon, PencilIcon, QuoteIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { MarkdownView } from "@/components/culture/markdown-view";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createBrowserSupabase } from "@/lib/supabase/client";

const TOOLS = [
  { action: "heading", icon: Heading2Icon },
  { action: "subheading", icon: Heading3Icon },
  { action: "bold", icon: BoldIcon },
  { action: "italic", icon: ItalicIcon },
  { action: "link", icon: LinkIcon },
  { action: "list", icon: ListIcon },
  { action: "quote", icon: QuoteIcon },
  { action: "image", icon: ImagePlusIcon },
] as const;

type Tool = (typeof TOOLS)[number]["action"];

/** Rich text for culture articles: a small Markdown toolbar, image upload and a live preview. */
export function MarkdownEditor({ id, value, onChange, dir, lang }: { id: string; value: string; onChange: (value: string) => void; dir: "ltr" | "rtl"; lang: string }) {
  const t = useTranslations("Admin.culture");
  const area = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(false);

  const wrap = (before: string, after = before, placeholder = t("text")) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const prefixLine = (prefix: string) => {
    const el = area.current;
    if (!el) return;
    const lineStart = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));
    requestAnimationFrame(() => el.focus());
  };

  const insertImage = async (image: File) => {
    if (!["image/png", "image/jpeg", "image/webp", "image/avif"].includes(image.type)) return void toast.error(t("imageInvalid"));
    const path = `culture/${crypto.randomUUID()}.${image.type.split("/")[1].replace("jpeg", "jpg")}`;
    const { error } = await createBrowserSupabase().storage.from("images").upload(path, image, { contentType: image.type, cacheControl: "31536000" });
    if (error) return void toast.error(t("imageFailed"));
    const el = area.current;
    const at = el?.selectionStart ?? value.length;
    onChange(`${value.slice(0, at)}\n\n![${t("imageAlt")}](${path})\n\n${value.slice(at)}`);
  };

  const apply = (action: Tool) => {
    if (action === "heading") prefixLine("## ");
    else if (action === "subheading") prefixLine("### ");
    else if (action === "bold") wrap("**");
    else if (action === "italic") wrap("*");
    else if (action === "link") wrap("[", "](https://)");
    else if (action === "list") prefixLine("- ");
    else if (action === "quote") prefixLine("> ");
    else file.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <div role="toolbar" aria-label={t("toolbar")} className="flex flex-wrap items-center gap-1 rounded-lg bg-muted/60 p-1">
        {TOOLS.map(({ action, icon: Icon }) => (
          <Button key={action} type="button" variant="ghost" size="icon-sm" aria-label={t(action)} title={t(action)} onClick={() => apply(action)} disabled={preview}>
            <Icon aria-hidden />
          </Button>
        ))}
        <Button type="button" variant="ghost" size="sm" className="ms-auto" onClick={() => setPreview(!preview)} aria-pressed={preview}>
          {preview ? <PencilIcon aria-hidden /> : <EyeIcon aria-hidden />}
          {preview ? t("edit") : t("preview")}
        </Button>
        <input
          ref={file}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          className="sr-only"
          onChange={(e) => {
            const image = e.target.files?.[0];
            if (image) void insertImage(image);
            e.target.value = "";
          }}
        />
      </div>
      {preview ? (
        <div dir={dir} lang={lang} className="min-h-64 rounded-lg p-4 ring-1 ring-border">
          <MarkdownView source={value} />
        </div>
      ) : (
        <Textarea id={id} ref={area} dir={dir} lang={lang} rows={16} value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-sm leading-relaxed" />
      )}
    </div>
  );
}
