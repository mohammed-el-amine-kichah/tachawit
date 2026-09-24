"use client";

import { useEffect } from "react";
import arabic from "@/messages/ar.json";
import english from "@/messages/en.json";
import "./globals.css";

// Replaces the root layout when it fails, so there is no locale or provider here: the message is
// shown in Arabic (the default language) and English.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-5 text-center text-foreground">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">{arabic.Error.title}</h1>
          <p className="text-muted-foreground">{arabic.Error.lead}</p>
        </div>
        <div lang="en" dir="ltr" className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{english.Error.title}</h2>
          <p className="text-muted-foreground">{english.Error.lead}</p>
        </div>
        <button
          type="button"
          onClick={retry}
          className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
        >
          {arabic.Error.retry} · {english.Error.retry}
        </button>
      </body>
    </html>
  );
}
