import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { safeNextPath } from "@/lib/site-url";
import { createServerSupabase } from "@/lib/supabase/server";

/** Where magic links and Google sign-in land: exchange the code for a session, then continue. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"), `/${routing.defaultLocale}`);
  const supabase = await createServerSupabase();

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { error: new Error("Missing code") };

  if (error) {
    const locale = next.split("/")[1] || routing.defaultLocale;
    return NextResponse.redirect(`${origin}/${locale}/login?error=link`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
