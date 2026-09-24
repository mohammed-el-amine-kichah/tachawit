import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const handleI18n = createMiddleware(routing);

export function proxy(request: NextRequest) {
  // First visits land on the default locale (Arabic) whatever the browser language;
  // a language picked in the switcher is still remembered through next-intl's cookie.
  const headers = new Headers(request.headers);
  headers.delete("accept-language");
  return handleI18n(new NextRequest(request, { headers }));
}

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
