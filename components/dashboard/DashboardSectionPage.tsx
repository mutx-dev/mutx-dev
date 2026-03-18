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
      className="overflow-hidden rounded-[28px] border"
      style={{
        borderColor: dashboardTokens.borderSubtle,
        background:
          "linear-gradient(180deg, rgba(15,23,42,0.94) 0%, rgba(2,6,23,0.98) 100%)",
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

      <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.6fr)_320px]">
        <div className="space-y-6">
          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor: dashboardTokens.borderSubtle,
              backgroundColor: dashboardTokens.bgSurface,
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: dashboardTokens.textMuted }}
                >
                  {badge}
                </p>
                <p
                  className="mt-3 max-w-3xl text-sm leading-6"
                  style={{ color: dashboardTokens.textSubtle }}
                >
                  This route now uses the ported mutx-control operator section shell, but the content stays truthful to MUTX. These are the next real integrations for this surface.
                </p>
              </div>
              <div
                className="rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{
                  borderColor: dashboardTokens.borderStrong,
                  backgroundColor: dashboardTokens.bgSubtle,
                  color: dashboardTokens.textPrimary,
                }}
              >
                No fake data
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {checks.map((item, index) => (
              <article
                key={item}
                className="rounded-2xl border p-4"
                style={{
                  borderColor: dashboardTokens.borderSubtle,
                  backgroundColor: dashboardTokens.bgSurface,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: dashboardTokens.textMuted }}
                  >
                    Next integration
                  </p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px]"
                    style={{
                      backgroundColor: dashboardTokens.bgSubtle,
                      color: dashboardTokens.textSubtle,
                      fontFamily: dashboardTokens.fontMono,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-3 text-sm" style={{ color: dashboardTokens.textPrimary }}>
                  {item}
                </p>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          {aside ?? (
            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: dashboardTokens.borderSubtle,
                backgroundColor: dashboardTokens.bgSurface,
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: dashboardTokens.textMuted }}
              >
                Port note
              </p>
              <p className="mt-3 text-sm leading-6" style={{ color: dashboardTokens.textSubtle }}>
                The shell is in. Real APIs and actions should land here route by route, instead of inventing OpenClaw-only controls that MUTX does not back.
              </p>
              <div
                className="mt-4 rounded-xl border p-3 text-sm"
                style={{
                  borderColor: dashboardTokens.borderSubtle,
                  backgroundColor: dashboardTokens.bgCanvas,
                  color: dashboardTokens.textPrimary,
                }}
              >
                Port one coherent unit per run. Keep the layout honest.
              </div>
            </div>
          )}

          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor: dashboardTokens.borderSubtle,
              backgroundColor: dashboardTokens.bgSurface,
            }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: dashboardTokens.textMuted }}
            >
              Operator principle
            </p>
            <div className="mt-3 flex items-start gap-3">
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" style={{ color: dashboardTokens.textPrimary }} />
              <p className="text-sm leading-6" style={{ color: dashboardTokens.textSubtle }}>
                Prefer route shells, panels, and nav structure first. Wire data only where MUTX already exposes it truthfully.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
