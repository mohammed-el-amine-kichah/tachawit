import Image from "next/image";

export function EntryImage({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return null;
  return (
    <div className="relative aspect-[4/3] w-full max-w-xs overflow-hidden rounded-3xl bg-muted shadow-soft">
      <Image src={src} alt={alt} fill sizes="(max-width: 640px) 80vw, 320px" className="object-cover" />
    </div>
  );
}
