"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const DOCS_URL = "https://docs.mutx.dev";

export function AuthNav() {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";
  const demoAppRoutes = new Set([
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
    pathname.startsWith("/control") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/app");

  if (isHiddenRoute) {
    return null;
  }

  return (
    <nav className="site-topbar">
      <div className="site-shell site-topbar-inner">
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
            <p className="site-brand-title hidden sm:block">
              control plane for deployed agents
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          <Link href="/#surface" className="site-nav-link">
            Surface
          </Link>
          <Link href="/#install" className="site-nav-link">
            Install
          </Link>
          <Link href="/contact" className="site-nav-link">
            Contact
          </Link>
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
            className="site-nav-link"
          >
            Docs
          </a>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isAuthPage ? (
            <>
              <Link href="/login" className="site-nav-link hidden md:block">
                Sign in
              </Link>
              <Link href="/dashboard" className="site-button-secondary hidden sm:inline-flex">
                Open dashboard
              </Link>
              <Link href="/#install" className="site-button-accent">
                Quickstart
              </Link>
            </>
          ) : (
            <>
              <Link href="/" className="site-nav-link hidden sm:block">
                Home
              </Link>
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noreferrer"
                className="site-nav-link hidden sm:block"
              >
                Docs
              </a>
              <Link href="/dashboard" className="site-button-accent">
                Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
