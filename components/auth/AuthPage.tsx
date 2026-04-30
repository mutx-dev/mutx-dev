"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

import { extractApiErrorMessage } from "@/components/app/http";
import { PicoAuthPreviewIntro } from "@/components/auth/PicoAuthPreviewIntro";
import { AuthSurface } from "@/components/site/AuthSurface";
import styles from "@/components/site/marketing/MarketingCore.module.css";
import { buildOAuthStartHref, oauthProviders } from "@/lib/auth/oauth";
import { resolveRedirectPath } from "@/lib/auth/redirects";

type AuthMode = "login" | "register";
type AuthPageHostVariant = "default" | "pico";

type AuthPageProps = {
  mode: AuthMode;
  nextPath?: string | null;
  fallbackPath?: string;
  hostVariant?: AuthPageHostVariant;
  initialError?: string | null;
  initialEmail?: string | null;
};

const authContent = {
  default: {
    login: {
      eyebrow: "Sign in",
      title: "Sign in to MUTX.",
      description:
        "Use your MUTX account to open the dashboard, review agents, and continue your setup.",
      asideEyebrow: "What unlocks next",
      asideTitle: "Your dashboard opens after sign-in.",
      asideBody:
        "Once your session is active, MUTX loads your agents, deployments, traces, and settings from the same workspace.",
      mediaSrc: "/landing/webp/wiring-bay.webp",
      mediaAlt: "MUTX robot operating inside a wiring bay",
      mediaWidth: 1024,
      mediaHeight: 1536,
      highlights: [
        "Use a provider or password to reach the same MUTX workspace.",
        "Sessions stay scoped to the current host.",
        "If sign-in fails, the form shows the returned error.",
      ],
      heading: "Welcome back",
      subheading:
        "Use a provider or password and continue into the dashboard.",
      submitLabel: "Sign in",
      loadingLabel: "Signing in",
    },
    register: {
      eyebrow: "Create account",
      title: "Create your MUTX account.",
      description:
        "Sign up with a password or provider, confirm your identity, and open the dashboard.",
      asideEyebrow: "Account rules",
      asideTitle: "Account setup should be clear and easy to verify.",
      asideBody:
        "MUTX sends verification email when needed and links provider identities to the same account.",
      mediaSrc: "/landing/webp/victory-core.webp",
      mediaAlt: "MUTX robot holding the MUTX mark after access is granted",
      mediaWidth: 1536,
      mediaHeight: 1024,
      highlights: [
        "Google, GitHub, Discord, and Apple can all create MUTX sessions.",
        "Password registration sends verification email to the current host.",
        "If email confirmation is required, the UI moves into a verification state.",
      ],
      heading: "Create your account",
      subheading:
        "Choose the fastest path into your hosted dashboard.",
      submitLabel: "Sign up",
      loadingLabel: "Creating account",
    },
  },
  pico: {
    login: {
      eyebrow: "Pico preview access",
      title: "Sign in to the Pico preview while the product is still taking shape.",
      description:
        "Pico is usable now, but it is still being built in public. Sign in to keep your progress attached to this preview and continue from where the current build leaves off.",
      asideEyebrow: "What to expect",
      asideTitle: "This is an early version, not the finished product.",
      asideBody:
        "Some parts already work well, some parts are still moving, and the sign-in wall is mainly here so your lessons, settings, and progress stay tied to one preview account.",
      mediaSrc: "/landing/webp/wiring-bay.webp",
      mediaAlt: "MUTX robot operating inside a wiring bay",
      mediaWidth: 1024,
      mediaHeight: 1536,
      highlights: [
        "You can already explore onboarding, academy, tutor, and support flows.",
        "Copy, layout, and product behavior will keep changing as Pico develops.",
        "Signing in keeps this preview personal instead of dropping you into a disposable demo.",
      ],
      heading: "Enter the current Pico build",
      subheading:
        "Use a provider or email to open the preview and save your place.",
      submitLabel: "Enter Pico",
      loadingLabel: "Opening Pico",
    },
    register: {
      eyebrow: "Pico preview access",
      title: "Create a Pico preview account for the version that exists today.",
      description:
        "This is the early-access lane for Pico. Create an account if you want your setup, progress, and feedback tied to the hosted preview while we keep building the rest.",
      asideEyebrow: "Why sign in now",
      asideTitle: "Because this preview already remembers your work.",
      asideBody:
        "Registration gives the current build a stable way to remember you while onboarding, lessons, and agent tools keep evolving.",
      mediaSrc: "/landing/webp/victory-core.webp",
      mediaAlt: "MUTX robot holding the MUTX mark after access is granted",
      mediaWidth: 1536,
      mediaHeight: 1024,
      highlights: [
        "Accounts created here stay scoped to the Pico preview host.",
        "Verification email and provider auth return you to the Pico flow, not the main dashboard.",
        "You get a real preview account, not a throwaway demo identity.",
      ],
      heading: "Create your Pico preview account",
      subheading:
        "Sign up once, save your place, and keep following the product as it improves.",
      submitLabel: "Create preview account",
      loadingLabel: "Creating preview account",
    },
  },
} as const;

function buildAuthHref(mode: AuthMode, nextPath: string) {
  return `/${mode}?next=${encodeURIComponent(nextPath)}`;
}

export function AuthPage({
  mode,
  nextPath,
  fallbackPath = "/dashboard",
  hostVariant = "default",
  initialError,
  initialEmail,
}: AuthPageProps) {
  const router = useRouter();
  const content = authContent[hostVariant][mode];
  const isRegister = mode === "register";
  const isPicoPreview = hostVariant === "pico";
  const redirectPath = resolveRedirectPath(nextPath, fallbackPath);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  const verificationError = /verification/i.test(error);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (isRegister && password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const payload =
        mode === "login" ? { email, password } : { email, password, name };

      const response = await fetch(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const responsePayload = await response.json().catch(() => ({
        detail:
          mode === "login" ? "Failed to sign in" : "Failed to create account",
      }));

      if (!response.ok) {
        throw new Error(
          extractApiErrorMessage(
            responsePayload,
            mode === "login" ? "Failed to sign in" : "Failed to create account",
          ),
        );
      }

      if (isRegister && responsePayload.requires_email_verification) {
        const verificationParams = new URLSearchParams({
          email,
          next: redirectPath,
        });
        router.replace(`/verify-email?${verificationParams.toString()}`);
        router.refresh();
        return;
      }

      router.replace(redirectPath);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : mode === "login"
            ? "Failed to sign in"
            : "Failed to create account",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!email) {
      setError("Enter your email address first");
      return;
    }

    setResendingVerification(true);
    setNotice("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json().catch(() => ({
        detail: "Failed to resend verification email",
      }));

      if (!response.ok) {
        throw new Error(
          extractApiErrorMessage(
            payload,
            "Failed to resend verification email",
          ),
        );
      }

      setNotice(payload.message || "Verification email sent");
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Failed to resend verification email",
      );
    } finally {
      setResendingVerification(false);
    }
  }

  return (
    <AuthSurface {...content} variant="access" hostVariant={hostVariant}>
      {isPicoPreview ? <PicoAuthPreviewIntro nextPath={redirectPath} /> : null}
      <div className={styles.formWrap}>
        {isPicoPreview ? (
          <div className="rounded-[26px] border border-[rgba(159,255,78,0.18)] bg-[linear-gradient(180deg,rgba(11,20,9,0.98),rgba(6,13,6,0.96))] px-4 py-4 text-[#f3faee] shadow-[0_24px_54px_rgba(4,10,3,0.3)] sm:px-5">
            <p className="font-[family:var(--font-mono)] text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(223,255,154,0.8)]">
              Pico preview note
            </p>
            <p className="mt-3 text-sm leading-7 text-[rgba(243,250,238,0.82)]">
              Pico is still being built. This login is here so the preview can
              remember your progress and let you come back to the same place
              later.
            </p>
          </div>
        ) : null}

        <div>
          <h2 className={styles.sectionTitle}>{content.heading}</h2>
          <p className={styles.bodyText}>{content.subheading}</p>
        </div>

        <div className="grid gap-2">
          {oauthProviders.map((provider) => (
            <Link
              key={provider.id}
              href={buildOAuthStartHref(provider.id, mode, redirectPath)}
              prefetch={false}
              className={`${styles.buttonSecondary} w-full`}
            >
              {provider.buttonLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ))}
        </div>

        <div
          className={
            isPicoPreview
              ? "flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[rgba(113,145,103,0.72)]"
              : "flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[rgba(77,58,45,0.58)]"
          }
        >
          <span
            className={
              isPicoPreview
                ? "h-px flex-1 bg-[rgba(159,255,78,0.18)]"
                : "h-px flex-1 bg-[rgba(58,38,25,0.16)]"
            }
          />
          Or use email
          <span
            className={
              isPicoPreview
                ? "h-px flex-1 bg-[rgba(159,255,78,0.18)]"
                : "h-px flex-1 bg-[rgba(58,38,25,0.16)]"
            }
          />
        </div>

        <form onSubmit={handleSubmit} className={styles.formWrap}>
          {isRegister ? (
            <div className={styles.field}>
              <label htmlFor="name" className={styles.fieldLabel}>
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
                className={styles.input}
              />
            </div>
          ) : null}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.fieldLabel}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.fieldLabel}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              autoComplete={isRegister ? "new-password" : "current-password"}
              className={styles.input}
            />
          </div>

          {isRegister ? (
            <div className={styles.field}>
              <label htmlFor="confirmPassword" className={styles.fieldLabel}>
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className={styles.input}
              />
            </div>
          ) : null}

          {notice ? (
            <div className={styles.success} role="status">
              <CheckCircle2 className="h-4 w-4" />
              {notice}
            </div>
          ) : null}

          {error ? (
            <div className={styles.error} role="alert">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className={`${styles.buttonPrimary} w-full disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {content.loadingLabel}
              </>
            ) : (
              <>
                {content.submitLabel}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className={styles.utilityLinks}>
          {mode === "login" ? (
            <>
              <Link href="/forgot-password" className={styles.inlineLink}>
                Forgot password?
              </Link>
              {verificationError ? (
                <button
                  type="button"
                  onClick={() => void handleResendVerification()}
                  disabled={resendingVerification}
                  className={styles.inlineLink}
                >
                  {resendingVerification
                    ? "Sending verification…"
                    : "Resend verification"}
                </button>
              ) : null}
              <p className={styles.bodyText}>
                Need access?{" "}
                <Link
                  href={buildAuthHref("register", redirectPath)}
                  className={styles.inlineLink}
                >
                  Create one
                </Link>
              </p>
            </>
          ) : (
            <p className={styles.bodyText}>
              Already have an account?{" "}
              <Link
                href={buildAuthHref("login", redirectPath)}
                className={styles.inlineLink}
              >
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </AuthSurface>
  );
}
