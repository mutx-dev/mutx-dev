"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Turnstile, { type BoundTurnstileObject } from "react-turnstile";

import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
    __mutxCalendlyLoader?: Promise<void>;
  }
}

const CALENDLY_URL = "https://calendly.com/defipath";
const CALENDLY_SCRIPT_ID = "mutx-calendly-script";
const CALENDLY_STYLE_ID = "mutx-calendly-style";
const CALENDLY_SCRIPT_SRC = "https://calendly.com/assets/external/widget.js";
const CALENDLY_STYLE_HREF = "https://calendly.com/assets/external/widget.css";

function ensureCalendlyLoaded() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.Calendly?.initPopupWidget) {
    return Promise.resolve();
  }

  if (window.__mutxCalendlyLoader) {
    return window.__mutxCalendlyLoader;
  }

  window.__mutxCalendlyLoader = new Promise<void>((resolve, reject) => {
    if (!document.getElementById(CALENDLY_STYLE_ID)) {
      const link = document.createElement("link");
      link.id = CALENDLY_STYLE_ID;
      link.rel = "stylesheet";
      link.href = CALENDLY_STYLE_HREF;
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById(
      CALENDLY_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Calendly failed to load")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = CALENDLY_SCRIPT_ID;
    script.src = CALENDLY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Calendly failed to load"));
    document.body.appendChild(script);
  }).catch((error) => {
    window.__mutxCalendlyLoader = undefined;
    throw error;
  });

  return window.__mutxCalendlyLoader;
}

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
    void ensureCalendlyLoaded().catch(() => {
      // Fall back to a normal tab open if the widget script fails.
    });
  }, []);

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

    try {
      await ensureCalendlyLoaded();
      window.Calendly?.initPopupWidget({ url: CALENDLY_URL });
    } catch {
      window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
    }
  }

  function handleTurnstileVerify(token: string, boundTurnstile: BoundTurnstileObject) {
    turnstileRef.current = boundTurnstile;
    setCaptchaToken(token);
    void ensureCalendlyLoaded()
      .then(() => {
        window.Calendly?.initPopupWidget({ url: CALENDLY_URL });
      })
      .catch(() => {
        window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
      });
    setShowChallenge(false);
  }

  function handleTurnstileError(_error?: unknown, boundTurnstile?: BoundTurnstileObject) {
    turnstileRef.current = boundTurnstile ?? null;
    setCaptchaToken(null);
    setShowChallenge(false);
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
      disabled={loadingSiteKey && !turnstileSiteKey}
    >
      {children}
    </button>
  );
}
