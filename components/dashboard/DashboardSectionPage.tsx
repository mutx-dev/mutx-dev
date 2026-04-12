import { type ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { TopBar, type TopBarBreadcrumb } from "@/components/dashboard/TopBar";
import { dashboardTokens } from "@/components/dashboard/tokens";

interface DashboardSectionPageProps {
  title: string;
  description: string;
  checks: string[];
  badge?: string;
  breadcrumbs?: TopBarBreadcrumb[];
  actions?: ReactNode;
  aside?: ReactNode;
}

export function DashboardSectionPage({
  title,
  description,
  checks,
  badge = "operator route",
  breadcrumbs,
  actions,
  aside,
}: DashboardSectionPageProps) {
  return (
    <section
      className="dashboard-entry overflow-hidden rounded-[36px] border"
      style={{
        borderColor: dashboardTokens.borderSubtle,
        background: dashboardTokens.panelGradientStrong,
        boxShadow: dashboardTokens.shadowLg,
      }}
    >
      <TopBar
        breadcrumbs={breadcrumbs}
        title={title}
        subtitle={description}
        actions={actions}
        className="border-b"
      />

      <div className="grid gap-6 p-5 lg:p-7 xl:grid-cols-[minmax(0,1.8fr)_320px]">
        <div className="space-y-6">
          <div
            className="rounded-[30px] border p-6"
            style={{
              borderColor: dashboardTokens.borderSubtle,
              background: dashboardTokens.panelGradient,
            }}
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(220px,0.5fr)] xl:items-end">
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.24em]"
                  style={{ color: dashboardTokens.textMuted }}
                >
                  {badge}
                </p>
                <h2 className="mt-3 font-[family:var(--font-site-display)] text-[1.75rem] leading-[1.02] tracking-[-0.07em] text-[#fff3e2]">
                  Ground the route around one real operator capability at a time.
                </h2>
                <p
                  className="mt-4 max-w-3xl text-sm leading-7"
                  style={{ color: dashboardTokens.textSubtle }}
                >
                  The shell is stable. The next additions should read like an operating ledger,
                  not placeholder product chrome: one live surface, one source of truth, one
                  useful next action.
                </p>
              </div>

              <div
                className="space-y-3 rounded-[24px] border px-4 py-4"
                style={{
                  borderColor: dashboardTokens.borderSubtle,
                  backgroundColor: dashboardTokens.bgInset,
                }}
              >
                <div
                  className="inline-flex rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]"
                  style={{
                    borderColor: dashboardTokens.borderStrong,
                    backgroundColor: dashboardTokens.brandSoft,
                    color: dashboardTokens.textPrimary,
                  }}
                >
                  Shell ready
                </div>
                <p className="text-[12px] leading-6" style={{ color: dashboardTokens.textSecondary }}>
                  Keep this page sparse until there is real signal, not speculative product
                  furniture.
                </p>
              </div>
            </div>
          </div>

          <section
            className="rounded-[30px] border p-4 sm:p-5"
            style={{
              borderColor: dashboardTokens.borderSubtle,
              background: dashboardTokens.panelGradient,
            }}
          >
            <div
              className="flex flex-wrap items-center justify-between gap-3 border-b pb-4"
              style={{ borderColor: dashboardTokens.borderSubtle }}
            >
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: dashboardTokens.textMuted }}
                >
                  Integration ledger
                </p>
                <p className="mt-2 text-sm leading-6" style={{ color: dashboardTokens.textSubtle }}>
                  Each row should become a real contract, live panel, or machine action before the
                  next one is added.
                </p>
              </div>
              <span
                className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{
                  borderColor: dashboardTokens.borderSubtle,
                  backgroundColor: dashboardTokens.bgInset,
                  color: dashboardTokens.textSecondary,
                }}
              >
                {checks.length} queued
              </span>
            </div>

            <ol className="mt-4 space-y-3">
              {checks.map((item, index) => (
                <li
                  key={item}
                  className="grid gap-3 rounded-[24px] border px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start"
                  style={{
                    borderColor: dashboardTokens.borderSubtle,
                    backgroundColor: dashboardTokens.bgInset,
                  }}
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{
                      borderColor: dashboardTokens.borderStrong,
                      backgroundColor: dashboardTokens.brandSoft,
                      color: dashboardTokens.textPrimary,
                      fontFamily: dashboardTokens.fontMono,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="min-w-0">
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: dashboardTokens.textMuted }}
                    >
                      Planned integration
                    </p>
                    <p className="mt-2 text-sm leading-7" style={{ color: dashboardTokens.textPrimary }}>
                      {item}
                    </p>
                  </div>

                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.18em] sm:justify-self-end"
                    style={{ color: dashboardTokens.textSecondary }}
                  >
                    not shipped
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-4">
          {aside ?? (
            <div
              className="rounded-[28px] border p-5"
              style={{
                borderColor: dashboardTokens.borderSubtle,
                background: dashboardTokens.panelGradient,
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: dashboardTokens.textMuted }}
              >
                Integration note
              </p>
              <p className="mt-3 text-sm leading-6" style={{ color: dashboardTokens.textSubtle }}>
                Live data and controls should land here only when backed by a real MUTX route contract or runtime action.
              </p>
              <div
                className="mt-4 rounded-[18px] border p-3 text-sm"
                style={{
                  borderColor: dashboardTokens.borderSubtle,
                  backgroundColor: dashboardTokens.bgInset,
                  color: dashboardTokens.textPrimary,
                }}
              >
                Add one coherent operational capability at a time.
              </div>
            </div>
          )}

          <div
            className="rounded-[28px] border p-5"
            style={{
              borderColor: dashboardTokens.borderSubtle,
              background: dashboardTokens.panelGradient,
            }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: dashboardTokens.textMuted }}
            >
              Operating rule
            </p>
            <div className="mt-3 flex items-start gap-3">
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" style={{ color: dashboardTokens.textPrimary }} />
              <p className="text-sm leading-6" style={{ color: dashboardTokens.textSubtle }}>
                Keep the shell stable, add live signal deliberately, and avoid decorative placeholders that imply non-existent capability.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
