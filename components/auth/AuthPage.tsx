"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { extractApiErrorMessage } from "@/components/app/http";
import { AuthSurface } from "@/components/site/AuthSurface";

type AuthMode = "login" | "register";

type AuthPageProps = {
  mode: AuthMode;
  nextPath?: string | null;
};

const authContent = {
  login: {
    eyebrow: "Operator sign-in",
    title: "Use the hosted auth lane when you want the real dashboard.",
    description:
      "Sign in with the hosted operator account, establish the session cleanly, and go straight into the live dashboard.",
    asideEyebrow: "What unlocks next",
    asideTitle: "The dashboard should fail honestly, not hide behind a paused auth shell.",
    asideBody:
      "Once the session is live, the dashboard can load fleet posture, deployment state, run activity, and security surfaces from the same operator boundary.",
    mediaSrc: "/landing/webp/docs-surface.webp",
    mediaAlt: "MUTX operator surface with documentation and dashboard context",
    mediaWidth: 1024,
    mediaHeight: 1024,
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
    title: "Create a hosted operator account and start in the real dashboard.",
    description:
      "Register with the hosted auth flow, confirm the password cleanly, and land in the same dashboard surface used for live operator work.",
    asideEyebrow: "Account rules",
    asideTitle: "Registration should be explicit and easy to verify.",
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

export function AuthPage({ mode, nextPath }: AuthPageProps) {
  const router = useRouter();
  const content = authContent[mode];
  const isRegister = mode === "register";
  const redirectPath = resolveRedirectPath(nextPath);

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
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.05em] text-white">
            {content.heading}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--site-text-soft)]">
            {content.subheading}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister ? (
            <div>
              <label htmlFor="name" className="site-form-label">
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
                className="site-input"
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="email" className="site-form-label">
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
              className="site-input"
            />
          </div>

          <div>
            <label htmlFor="password" className="site-form-label">
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
              className="site-input"
            />
          </div>

          {isRegister ? (
            <div>
              <label htmlFor="confirmPassword" className="site-form-label">
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
              className="site-input"
            />
            </div>
          ) : null}

          {error ? (
            <div className="site-status-error" role="alert">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="site-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
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

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          {mode === "login" ? (
            <>
              <Link
                href="/forgot-password"
                className="text-[color:var(--site-text-muted)] transition hover:text-white"
              >
                Forgot password?
              </Link>
              <p className="text-[color:var(--site-text-muted)]">
                Need access?{" "}
                <Link href="/register" className="text-white transition hover:text-cyan-200">
                  Create one
                </Link>
              </p>
            </>
          ) : (
            <p className="text-[color:var(--site-text-muted)]">
              Already have an operator account?{" "}
              <Link href="/login" className="text-white transition hover:text-cyan-200">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </AuthSurface>
  );
}
