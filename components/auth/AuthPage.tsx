"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { extractApiErrorMessage } from "@/components/app/http";
import { AuthSurface } from "@/components/site/AuthSurface";
import styles from "@/components/site/marketing/MarketingCore.module.css";

type AuthMode = "login" | "register";

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

  if (nextPath.startsWith("/login") || nextPath.startsWith("/register")) {
    return "/dashboard";
  }

  return nextPath;
}

export function AuthPage({
  mode,
  nextPath,
  routePrefix = "",
  contentOverride,
}: AuthPageProps) {
  const router = useRouter();
  const content = { ...authContent[mode], ...contentOverride } as AuthContent;
  const isRegister = mode === "register";
  const redirectPath = resolveRedirectPath(nextPath);
  const loginHref = routePrefix ? `${routePrefix}/login` : "/login";
  const registerHref = routePrefix ? `${routePrefix}/register` : "/register";

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
      const payload =
        mode === "login"
          ? { email, password }
          : { email, password, name };

      const response = await fetch(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

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

  return (
    <AuthSurface {...content}>
      <div className={styles.formWrap}>
        <div>
          <h2 className={styles.sectionTitle}>{content.heading}</h2>
          <p className={styles.bodyText}>{content.subheading}</p>
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
              <Link
                href="/forgot-password"
                className={styles.inlineLink}
              >
                Forgot password?
              </Link>
              <p className={styles.bodyText}>
                Need access?{" "}
                <Link href={registerHref} className={styles.inlineLink}>
                  Create one
                </Link>
              </p>
            </>
          ) : (
            <p className={styles.bodyText}>
              Already have an operator account?{" "}
              <Link href={loginHref} className={styles.inlineLink}>
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </AuthSurface>
  );
}
