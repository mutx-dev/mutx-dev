"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LoginDisabledButton } from "@/components/landing/LoginDisabledButton";

const DOCS_URL = "https://docs.mutx.dev";

export function AuthNav() {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";
  const demoAppRoutes = new Set([
    "/",
    "/overview",
    "/agents",
    "/deployments",
    "/runs",
    "/environments",
    "/access",
    "/connectors",
    "/audit",
    "/usage",
    "/settings",
    "/logs",
    "/traces",
    "/memory",
    "/orchestration",
  ]);
  const isHiddenRoute =
    demoAppRoutes.has(pathname) ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/app");

  if (isHiddenRoute) {
    return null;
  }

  return (
    <nav className="site-topbar">
      <div className="site-shell flex items-center justify-between py-4">
        <Link href="/" className="site-brand">
          <div className="site-brand-mark">
            <Image
              src="/logo.png"
              alt="MUTX"
              fill
              sizes="2.75rem"
              className="object-contain p-1.5"
            />
          </div>
          <div>
            <p className="site-brand-overline">MUTX</p>
            <p className="site-brand-title">
              control plane for agents with a pulse
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {!isAuthPage ? (
            <>
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noreferrer"
                className="site-nav-link hidden sm:block"
              >
                Docs
              </a>
              <LoginDisabledButton className="[&>button]:px-0 [&>button]:py-0 [&>button]:font-medium [&>button]:text-[0.95rem] [&>button]:text-white/66 [&>button]:border-transparent [&>button]:bg-transparent [&>button:hover]:bg-transparent [&>button:hover]:text-white" />
              <Link href="/#quickstart" className="site-button-accent">
                Get started
              </Link>
            </>
          ) : (
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="site-nav-link"
            >
              Docs
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
