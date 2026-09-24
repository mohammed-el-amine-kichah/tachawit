"use client";

import { MailCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { requestMagicLink, signInWithGoogle, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Google's brand colours are required by their sign-in branding guidelines (the one exception to tokens). */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5">
      <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.8 3.2-8Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  );
}

/** Magic link or Google. No passwords to remember. */
export function LoginForm({ next, error }: { next: string | null; error: string | null }) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(requestMagicLink, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 text-center" role="status">
        <MailCheckIcon aria-hidden className="size-14 text-success" />
        <h2 className="text-2xl font-semibold">{t("sent")}</h2>
        <p className="text-muted-foreground">{t("sentLead")}</p>
      </div>
    );
  }

  const message =
    state.error === "invalid_email"
      ? t("invalidEmail")
      : state.error === "failed"
        ? t("failed")
        : error === "link"
          ? t("linkError")
          : error === "google"
            ? t("googleError")
            : null;

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-3" noValidate>
        {next && <input type="hidden" name="next" value={next} />}
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          required
          placeholder={t("emailPlaceholder")}
          aria-invalid={state.error === "invalid_email" || undefined}
          aria-describedby={message ? "login-error" : undefined}
          className="h-12 text-base"
        />
        <Button type="submit" size="lg" disabled={pending} className="h-12 rounded-xl text-base">
          {pending ? t("sending") : t("sendLink")}
        </Button>
      </form>

      {message && (
        <p id="login-error" role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("or")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={signInWithGoogle}>
        {next && <input type="hidden" name="next" value={next} />}
        <Button type="submit" variant="outline" size="lg" className="h-12 w-full rounded-xl text-base">
          <GoogleMark />
          {t("google")}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">{t("privacy")}</p>
    </div>
  );
}
