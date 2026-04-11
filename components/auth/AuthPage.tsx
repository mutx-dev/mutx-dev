"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { extractApiErrorMessage } from "@/components/app/http";
import { PicoProductShell } from "@/components/pico/PicoProductShell";
import {
  picoFieldClass,
  picoPrimaryButtonClass,
  picoSecondaryButtonClass,
  picoSectionLabelClass,
  picoSurfaceClass,
  picoSurfaceInsetClass,
} from "@/components/pico/picoUi";
import { AuthSurface } from "@/components/site/AuthSurface";
import styles from "@/components/site/marketing/MarketingCore.module.css";

type AuthMode = "login" | "register";
type AuthVariant = "default" | "pico";

type AuthContent = {
  eyebrow: string;
  title: string;
  description: string;
  asideEyebrow: string;
  asideTitle: string;
  asideBody: string;
  mediaSrc: string;
  mediaAlt: string;
  mediaWidth: number;
  mediaHeight: number;
  highlights: readonly string[];
  heading: string;
  subheading: string;
  submitLabel: string;
  loadingLabel: string;
};

type AuthPageProps = {
  mode: AuthMode;
  nextPath?: string | null;
  routePrefix?: string;
  contentOverride?: Partial<AuthContent>;
  variant?: AuthVariant;
};

const authContent = {
  login: {
    eyebrow: "Operator sign-in",
    title: "Sign in to the governed runtime.",
    description:
      "Use the hosted operator account, establish the session cleanly, and continue into the dashboard that reflects real deployment state instead of a demo shell.",
    asideEyebrow: "What unlocks next",
    asideTitle: "The dashboard should tell the truth the moment auth succeeds.",
    asideBody:
      "Once the session is live, MUTX can load fleet posture, deployment state, traces, and security surfaces from the same operator boundary.",
    mediaSrc: "/landing/webp/wiring-bay.webp",
    mediaAlt: "MUTX robot operating inside a wiring bay",
    mediaWidth: 1024,
    mediaHeight: 1536,
    highlights: [
      "Hosted sign-in now routes into the live dashboard instead of a hold screen.",
      "Session cookies stay scoped to the app host so auth does not leak across subdomains.",
      "If the API rejects the session, the form surfaces the upstream error instead of inventing one.",
    ],
    heading: "Welcome back",
    subheading: "Sign in and continue into the operator dashboard.",
    submitLabel: "Sign in",
    loadingLabel: "Signing in",
  },
  register: {
    eyebrow: "Operator access",
    title: "Create an operator account and enter the real dashboard.",
    description:
      "Register with the hosted auth flow, confirm the password cleanly, and land in the same control surface used for live operator work.",
    asideEyebrow: "Account rules",
    asideTitle: "Registration should be explicit, boring, and easy to verify.",
    asideBody:
      "The registration lane now validates what matters, sends the request through the hosted auth API, and only moves forward once the session is established.",
    mediaSrc: "/landing/webp/victory-core.webp",
    mediaAlt: "MUTX robot holding the MUTX mark after access is granted",
    mediaWidth: 1536,
    mediaHeight: 1024,
    highlights: [
      "Passwords must match before the request leaves the browser.",
      "Hosted registration uses the same auth cookies and redirect path as sign-in.",
      "The dashboard route is now reachable directly after account creation.",
    ],
    heading: "Create your account",
    subheading: "Set up hosted access and continue into the dashboard.",
    submitLabel: "Sign up",
    loadingLabel: "Creating account",
  },
} as const;

function resolveRedirectPath(nextPath?: string | null) {
  if (!nextPath) {
    return "/dashboard";
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }

  if (
    nextPath.startsWith("/login") ||
    nextPath.startsWith("/register") ||
    nextPath.startsWith("/pico/login") ||
    nextPath.startsWith("/pico/register")
  ) {
    return "/dashboard";
  }

  return nextPath;
}

export function AuthPage({
  mode,
  nextPath,
  routePrefix = "",
  contentOverride,
  variant = "default",
}: AuthPageProps) {
  const router = useRouter();
  const content = { ...authContent[mode], ...contentOverride } as AuthContent;
  const isRegister = mode === "register";
  const redirectPath = resolveRedirectPath(nextPath);
  const loginHref = routePrefix ? `${routePrefix}/login` : "/login";
  const registerHref = routePrefix ? `${routePrefix}/register` : "/register";
  const startHref = routePrefix ? `${routePrefix}/start` : "/dashboard";
  const supportHref = routePrefix ? `${routePrefix}/support` : "/support";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    try {
      const payload = mode === "login" ? { email, password } : { email, password, name };

      const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responsePayload = await response.json().catch(() => ({
        detail: mode === "login" ? "Failed to sign in" : "Failed to create account",
      }));

      if (!response.ok) {
        throw new Error(
          extractApiErrorMessage(
            responsePayload,
            mode === "login" ? "Failed to sign in" : "Failed to create account",
          ),
        );
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

  function renderForm(isPico: boolean) {
    const fieldWrapClass = isPico ? "space-y-2" : styles.field;
    const labelClass = isPico ? "text-sm font-medium text-white/75" : styles.fieldLabel;
    const inputClass = isPico ? picoFieldClass : styles.input;
    const formClass = isPico ? "mt-6 space-y-4" : styles.formWrap;
    const bodyClass = isPico ? "text-sm leading-7 text-white/65" : styles.bodyText;
    const linkClass = isPico ? "font-semibold text-cyan-100" : styles.inlineLink;
    const errorClass = isPico
      ? "flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-50"
      : styles.error;
    const submitClass = isPico
      ? `${picoPrimaryButtonClass} w-full px-4 py-3 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45`
      : `${styles.buttonPrimary} w-full disabled:cursor-not-allowed disabled:opacity-60`;
    const utilityClass = isPico ? "mt-5 space-y-3" : styles.utilityLinks;

    return (
      <>
        <div>
          <h2 className={isPico ? "text-2xl font-semibold text-white" : styles.sectionTitle}>{content.heading}</h2>
          <p className={bodyClass}>{content.subheading}</p>
        </div>

        <form onSubmit={handleSubmit} className={formClass}>
          {isRegister ? (
            <div className={fieldWrapClass}>
              <label htmlFor="name" className={labelClass}>
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
                className={inputClass}
              />
            </div>
          ) : null}

          <div className={fieldWrapClass}>
            <label htmlFor="email" className={labelClass}>
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
              className={inputClass}
            />
          </div>

          <div className={fieldWrapClass}>
            <label htmlFor="password" className={labelClass}>
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
              className={inputClass}
            />
          </div>

          {isRegister ? (
            <div className={fieldWrapClass}>
              <label htmlFor="confirmPassword" className={labelClass}>
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
                className={inputClass}
              />
            </div>
          ) : null}

          {error ? (
            <div className={errorClass} role="alert">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <button type="submit" disabled={loading} className={submitClass}>
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

        <div className={utilityClass}>
          {mode === "login" ? (
            <>
              <Link href="/forgot-password" className={linkClass}>
                Forgot password?
              </Link>
              <p className={bodyClass}>
                Need access?{" "}
                <Link href={registerHref} className={linkClass}>
                  Create one
                </Link>
              </p>
            </>
          ) : (
            <p className={bodyClass}>
              Already have an operator account?{" "}
              <Link href={loginHref} className={linkClass}>
                Sign in
              </Link>
            </p>
          )}
        </div>
      </>
    );
  }

  if (variant === "pico") {
    return (
      <PicoProductShell
        title={content.title}
        description={content.description}
        actions={
          <Link href={startHref} className={picoSecondaryButtonClass}>
            Back to Pico start
          </Link>
        }
      >
        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className={`${picoSurfaceClass} p-6`}>{renderForm(true)}</div>

          <aside className="space-y-4">
            <div className={`${picoSurfaceClass} p-6`}>
              <p className={picoSectionLabelClass}>{content.asideEyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{content.asideTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-white/65">{content.asideBody}</p>
              <div className="mt-5 space-y-3">
                {content.highlights.map((item) => (
                  <div key={item} className={`${picoSurfaceInsetClass} p-4 text-sm leading-7 text-white/70`}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className={`${picoSurfaceClass} p-6`}>
              <p className={picoSectionLabelClass}>What happens next</p>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <div className={`${picoSurfaceInsetClass} p-4`}>
                  1. Return to Pico Start and keep the first-run checklist in one place.
                </div>
                <div className={`${picoSurfaceInsetClass} p-4`}>
                  2. Open the next academy lesson instead of wandering the whole product.
                </div>
                <div className={`${picoSurfaceInsetClass} p-4`}>
                  3. Use grounded support if the first operator step breaks.
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={startHref} className={picoPrimaryButtonClass}>
                  Open Pico start
                </Link>
                <Link href={supportHref} className={picoSecondaryButtonClass}>
                  Open support
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </PicoProductShell>
    );
  }

  return (
    <AuthSurface {...content}>
      <div className={styles.formWrap}>{renderForm(false)}</div>
    </AuthSurface>
  );
}
