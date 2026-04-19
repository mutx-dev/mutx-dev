"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
  isPicoHost,
  resolveRedirectPath,
} from "@/lib/auth/redirects";

function VerifyEmailContent() {
  const t = useTranslations("pico.authRecovery.verifyEmail");
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
      ? t("verifying")
      : email
        ? t("sentTo", { email })
        : t("missingContext"),
  );
  const [resending, setResending] = useState(false);
  const [hostVariant, setHostVariant] = useState<"default" | "pico">("default");

  const loginHref = useMemo(() => {
    const params = new URLSearchParams({ next: nextPath });
    if (email) {
      params.set("email", email);
    }
    return `/login?${params.toString()}`;
  }, [email, nextPath]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setHostVariant(isPicoHost(window.location.hostname) ? "pico" : "default");
  }, []);

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
          detail: t("verifyFailure"),
        }));

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            typeof payload?.detail === "string"
              ? payload.detail
              : t("verifyFailure"),
          );
        }

        setStatus("success");
        setMessage(payload.message || t("verifySuccess"));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : t("verifyFailure"),
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
      setMessage(t("resendNeedsEmail"));
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
        detail: t("resendFailure"),
      }));

      if (!response.ok) {
        throw new Error(
          typeof payload?.detail === "string"
            ? payload.detail
            : t("resendFailure"),
        );
      }

      setStatus("pending");
      setMessage(
        payload.message || t("resendSent", { email }),
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : t("resendFailure"),
      );
    } finally {
      setResending(false);
    }
  }

  const authSurfaceProps = {
    eyebrow: t("eyebrow"),
    title: t("title"),
    description: t("description"),
    asideEyebrow: t("asideEyebrow"),
    asideTitle: t("asideTitle"),
    asideBody: t("asideBody"),
    mediaSrc: "/landing/webp/reading-bench.webp",
    mediaAlt: "MUTX robot reviewing a verification packet on a bench",
    mediaWidth: 1024,
    mediaHeight: 1536,
    highlights: [t("highlights.0"), t("highlights.1"), t("highlights.2")],
  } as const;

  return (
    <AuthSurface {...authSurfaceProps} variant="recovery" hostVariant={hostVariant}>
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
              <h2 className={styles.sectionTitle}>{t("verificationComplete")}</h2>
              <p className={styles.bodyText}>
                {t("verificationCompleteBody")}
              </p>
            </div>

            <div className={styles.ctaRow}>
              <Link href={loginHref} className={styles.buttonPrimary}>
                {t("signIn")}
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
              <h2 className={styles.sectionTitle}>{t("checkInbox")}</h2>
              <p className={styles.bodyText}>
                {t("checkInboxBody")}
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
                    {t("resendSending")}
                  </>
                ) : (
                  <>
                    {t("resend")}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <Link href={loginHref} className={styles.buttonSecondary}>
                {t("signIn")}
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
              <h2 className={styles.sectionTitle}>{t("verificationFailed")}</h2>
              <p className={styles.bodyText}>
                {t("verificationFailedBody")}
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
                      {t("resendSending")}
                    </>
                  ) : (
                    <>
                      {t("resend")}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              ) : null}
              <Link href={loginHref} className={styles.buttonSecondary}>
                {t("signIn")}
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
