"use client";

import { ImagePlusIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { getPublicStorageUrl } from "@/lib/supabase/storage";

const TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"];

/** Uploads an image to the public "images" bucket and returns its path. */
export function ImageField({ folder, value, onChange }: { folder: string; value: string; onChange: (path: string) => void }) {
  const t = useTranslations("Admin.image");
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    if (!TYPES.includes(file.type) || file.size > 10 * 1024 * 1024) {
      toast.error(t("invalid"));
      return;
    }
    setBusy(true);
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await createBrowserSupabase().storage.from("images").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    setBusy(false);
    if (error) toast.error(t("failed"));
    else onChange(path);
  };

  const url = value ? getPublicStorageUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!, "images", value) : null;

  return (
    <div className="flex items-center gap-3">
      {url ? (
        <div className="relative size-20 overflow-hidden rounded-xl ring-1 ring-border">
          <Image src={url} alt="" fill sizes="80px" className="object-cover" />
        </div>
      ) : (
        <div className="grid size-20 place-items-center rounded-xl bg-muted text-muted-foreground">
          <ImagePlusIcon aria-hidden />
        </div>
      )}
      <input
        ref={input}
        type="file"
        accept={TYPES.join(",")}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = "";
        }}
      />
      <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? t("uploading") : url ? t("replace") : t("add")}
      </Button>
      {url && (
        <Button type="button" variant="ghost" size="icon" aria-label={t("remove")} onClick={() => onChange("")}>
          <Trash2Icon aria-hidden />
        </Button>
      )}
    </div>
  );
}
