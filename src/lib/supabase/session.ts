import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import type { Database } from "./types";

/** True when the request carries Supabase auth cookies (guests skip the session refresh). */
export function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}

/**
 * Refreshes the learner's session. Refreshed cookies are written onto the request (so this
 * request's Server Components see them) and returned so they can be set on the response.
 */
export async function refreshSession(request: NextRequest) {
  const pending: { cookies: { name: string; value: string; options: object }[]; headers: Record<string, string> } = {
    cookies: [],
    headers: {},
  };
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          pending.cookies.push(...cookiesToSet);
          Object.assign(pending.headers, headers);
        },
      },
    },
  );
  // Do not run code between creating the client and getClaims(): it triggers the refresh.
  await supabase.auth.getClaims();
  return pending;
}

export function applySession(response: NextResponse, pending: Awaited<ReturnType<typeof refreshSession>>) {
  pending.cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  Object.entries(pending.headers).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}
