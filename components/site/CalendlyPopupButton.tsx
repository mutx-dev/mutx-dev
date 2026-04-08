"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Turnstile, { type BoundTurnstileObject } from "react-turnstile";

import { cn } from "@/lib/utils";

const CALENDLY_URL = "https://calendly.com/defipath";

type CalendlyPopupButtonProps = {
  children: ReactNode;
  className?: string;
  fallbackClassName?: string;
  ariaLabel?: string;
};

export function CalendlyPopupButton({
  children,
  className,
  fallbackClassName,
  ariaLabel = "Book a call with MUTX",
}: CalendlyPopupButtonProps) {
  const [showChallenge, setShowChallenge] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState("");
  const [loadingSiteKey, setLoadingSiteKey] = useState(true);
  const turnstileRef = useRef<BoundTurnstileObject | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTurnstileSiteKey() {
      try {
        const response = await fetch("/api/turnstile/site-key", {
          cache: "no-store",
        });
        const payload = await response.json();
        const nextSiteKey =
          typeof payload.siteKey === "string" ? payload.siteKey.trim() : "";

        if (!cancelled) {
          setTurnstileSiteKey(nextSiteKey);
        }
      } catch {
        if (!cancelled) {
          setTurnstileSiteKey("");
        }
      } finally {
        if (!cancelled) {
          setLoadingSiteKey(false);
        }
      }
    }

    void loadTurnstileSiteKey();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleClick() {
    if (!captchaToken) {
      setShowChallenge(true);
      return;
    }

    window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
  }

  function handleTurnstileVerify(token: string, boundTurnstile: BoundTurnstileObject) {
    turnstileRef.current = boundTurnstile;
    setCaptchaToken(token);
    window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
    setShowChallenge(false);
  }

  function handleTurnstileError(_error?: unknown, boundTurnstile?: BoundTurnstileObject) {
    turnstileRef.current = boundTurnstile ?? null;
    setCaptchaToken(null);
    // Keep the challenge visible and reset the widget so the user can retry immediately.
    boundTurnstile?.reset();
  }

  function handleTurnstileExpire(_token: string, boundTurnstile?: BoundTurnstileObject) {
    turnstileRef.current = boundTurnstile ?? null;
    setCaptchaToken(null);
  }

  if (showChallenge && turnstileSiteKey) {
    return (
      <div className={cn(fallbackClassName, className)}>
        <Turnstile
          action="book-call"
          appearance="always"
          className="min-h-[65px]"
          fixedSize
          onError={handleTurnstileError}
          onExpire={handleTurnstileExpire}
          onLoad={(_, boundTurnstile) => {
            turnstileRef.current = boundTurnstile ?? null;
          }}
          onVerify={handleTurnstileVerify}
          refreshExpired="auto"
          sitekey={turnstileSiteKey}
          size="flexible"
          theme="auto"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={cn(fallbackClassName, className)}
      disabled={loadingSiteKey || !turnstileSiteKey}
    >
      {children}
    </button>
  );
}
