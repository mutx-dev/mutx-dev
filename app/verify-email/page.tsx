"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";

import { AuthSurface } from "@/components/site/AuthSurface";
import styles from "@/components/site/marketing/MarketingCore.module.css";
import {
  getDefaultRedirectPathForHost,
  resolveRedirectPath,
} from "@/lib/auth/redirects";

const authSurfaceProps = {
  eyebrow: "Verify email",
  title: "Confirm the address before the platform pretends you are ready.",
  description:
    "Verification is part of the account boundary now. The flow confirms the token honestly, can resend from the active host, and keeps the next route stable instead of bouncing you into a fake success state.",
  asideEyebrow: "Verification rules",
  asideTitle: "Keep confirmation explicit.",
  asideBody:
    "Provider auth can skip this because the upstream identity is already verified. Password registration stays accountable through the email confirmation lane.",
  mediaSrc: "/landing/webp/reading-bench.webp",
  mediaAlt: "MUTX robot reviewing a verification packet on a bench",
  mediaWidth: 1024,
  mediaHeight: 1536,
  highlights: [
    "Verification links terminate on the active frontend host instead of a hardcoded marketing route.",
    "Expired or invalid tokens fail honestly and leave a clear resend path.",
    "After confirmation, the sign-in lane can send you directly back to the intended platform route.",
  ],
} as const;

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const fallbackPath =
    typeof window === "undefined"
      ? "/dashboard"
      : getDefaultRedirectPathForHost(window.location.hostname);
  const nextPath = resolveRedirectPath(searchParams.get("next"), fallbackPath);

  const [status, setStatus] = useState<
    "pending" | "loading" | "success" | "error"
  >(token ? "loading" : email ? "pending" : "error");
  const [message, setMessage] = useState(
    token
      ? "Verifying your email…"
      : email
        ? `We sent a verification link to ${email}.`
        : "This verification route needs a token or the email that should receive one.",
  );
  const [resending, setResending] = useState(false);

  const loginHref = useMemo(() => {
    const params = new URLSearchParams({ next: nextPath });
    if (email) {
      params.set("email", email);
    }
    return `/login?${params.toString()}`;
  }, [email, nextPath]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function verify() {
      setStatus("loading");

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const payload = await response.json().catch(() => ({
          detail: "Failed to verify email",
        }));

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            typeof payload?.detail === "string"
              ? payload.detail
              : "Failed to verify email",
          );
        }

        setStatus("success");
        setMessage(payload.message || "Email has been verified successfully.");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Failed to verify email",
        );
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleResend() {
    if (!email) {
      setStatus("error");
      setMessage(
        "Enter the address on the sign-up form first so verification can be resent.",
      );
      return;
    }

    setResending(true);

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
          typeof payload?.detail === "string"
            ? payload.detail
            : "Failed to resend verification email",
        );
      }

      setStatus("pending");
      setMessage(
        payload.message || `We sent another verification link to ${email}.`,
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to resend verification email",
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthSurface {...authSurfaceProps} variant="recovery">
      <div className={styles.formWrap}>
        {status === "loading" ? (
          <div className={styles.success}>
            <Loader2 className="h-4 w-4 animate-spin" />
            {message}
          </div>
        ) : null}

        {status === "success" ? (
          <>
            <div className={styles.success}>
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </div>

            <div>
              <h2 className={styles.sectionTitle}>Verification complete</h2>
              <p className={styles.bodyText}>
                The account can sign in now. Use the same email and continue
                into the intended route.
              </p>
            </div>

            <div className={styles.ctaRow}>
              <Link href={loginHref} className={styles.buttonPrimary}>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : null}

        {status === "pending" ? (
          <>
            <div className={styles.success}>
              <Mail className="h-4 w-4" />
              {message}
            </div>

            <div>
              <h2 className={styles.sectionTitle}>Check your inbox</h2>
              <p className={styles.bodyText}>
                Open the verification link from the same device if possible. If
                it does not arrive, resend it from here.
              </p>
            </div>

            <div className={styles.ctaRow}>
              <button
                type="button"
                onClick={() => void handleResend()}
                disabled={resending}
                className={styles.buttonPrimary}
              >
                {resending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    Resend verification
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <Link href={loginHref} className={styles.buttonSecondary}>
                Back to sign in
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : null}

        {status === "error" ? (
          <>
            <div className={styles.error}>
              <AlertCircle className="h-4 w-4" />
              {message}
            </div>

            <div>
              <h2 className={styles.sectionTitle}>Verification failed</h2>
              <p className={styles.bodyText}>
                If the token expired, request another message from the address
                that owns the account.
              </p>
            </div>

            <div className={styles.ctaRow}>
              {email ? (
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={resending}
                  className={styles.buttonPrimary}
                >
                  {resending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Resend verification
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              ) : null}
              <Link href={loginHref} className={styles.buttonSecondary}>
                Back to sign in
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </AuthSurface>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <main className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </main>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
