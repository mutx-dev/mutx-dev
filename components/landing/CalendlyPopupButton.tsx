"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

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
};

export function CalendlyPopupButton({
  children,
  className,
  fallbackClassName,
}: CalendlyPopupButtonProps) {
  useEffect(() => {
    void ensureCalendlyLoaded().catch(() => {
      // Fall back to a normal link open on click if the script does not load.
    });
  }, []);

  async function handleClick() {
    try {
      await ensureCalendlyLoaded();
      window.Calendly?.initPopupWidget({ url: CALENDLY_URL });
    } catch {
      window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(fallbackClassName, className)}
    >
      {children}
    </button>
  );
}
