"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { getPathname } from "@/i18n/navigation";
import { safeNextPath, siteOrigin } from "@/lib/site-url";
import { createServerSupabase } from "@/lib/supabase/server";

export type AuthFormState = { status: "idle" | "sent" | "error"; error?: "invalid_email" | "failed" };

async function callbackUrl(next: string) {
  return `${await siteOrigin()}/api/auth/callback?next=${encodeURIComponent(next)}`;
}

async function defaultNext() {
  return getPathname({ href: "/profile", locale: await getLocale() });
}

export async function requestMagicLink(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim());
  if (!email.success) return { status: "error", error: "invalid_email" };

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: await callbackUrl(safeNextPath(formData.get("next"), await defaultNext())) },
  });
  if (error) {
    console.error("Magic link failed", error.message);
    return { status: "error", error: "failed" };
  }
  return { status: "sent" };
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl(safeNextPath(formData.get("next"), await defaultNext())) },
  });
  if (error || !data.url) {
    console.error("Google sign-in failed", error?.message);
    redirect(`${getPathname({ href: "/login", locale: await getLocale() })}?error=google`);
  }
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(getPathname({ href: "/", locale: await getLocale() }));
}

export type ProfileFormState = { status: "idle" | "saved" | "error" };

export async function updateDisplayName(_: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const name = z.string().trim().min(1).max(60).safeParse(formData.get("displayName"));
  if (!name.success) return { status: "error" };
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) return { status: "error" };
  const { error } = await supabase.from("profiles").update({ display_name: name.data }).eq("id", data.claims.sub);
  if (error) return { status: "error" };
  revalidatePath("/", "layout");
  return { status: "saved" };
}
