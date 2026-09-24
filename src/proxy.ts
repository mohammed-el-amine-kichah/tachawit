import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { buildContentSecurityPolicy } from "@/lib/security/csp";
import { applySession, hasAuthCookie, refreshSession } from "@/lib/supabase/session";

const handleI18n = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  // Refresh the session first so the locale handling below forwards the fresh cookies.
  const session = hasAuthCookie(request) ? await refreshSession(request) : null;

  // First visits land on the default locale (Arabic) whatever the browser language;
  // a language picked in the switcher is still remembered through next-intl's cookie.
  const headers = new Headers(request.headers);
  headers.delete("accept-language");

  // Next.js reads the nonce from the request's policy and adds it to its own scripts.
  const csp = buildContentSecurityPolicy({
    nonce: btoa(crypto.randomUUID()),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    dev: process.env.NODE_ENV === "development",
  });
  headers.set("Content-Security-Policy", csp);

  const response = handleI18n(new NextRequest(request, { headers }));
  response.headers.set("Content-Security-Policy", csp);

  return session ? applySession(response, session) : response;
}

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
