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
      className="dashboard-entry overflow-hidden rounded-[28px] border"
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

      <div className="grid gap-5 p-5 lg:p-6 xl:grid-cols-[minmax(0,1.65fr)_320px]">
        <div className="space-y-6">
          <div
            className="rounded-[22px] border p-5"
            style={{
              borderColor: dashboardTokens.borderSubtle,
              background: dashboardTokens.panelGradient,
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
                  The shell and route structure are live. The items below are the next verified integrations queued for this surface.
                </p>
              </div>
              <div
                className="rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{
                  borderColor: dashboardTokens.borderStrong,
                  backgroundColor: dashboardTokens.brandSoft,
                  color: dashboardTokens.textPrimary,
                }}
              >
                Shell ready
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {checks.map((item, index) => (
              <article
                key={item}
                className="rounded-[20px] border p-4"
                style={{
                  borderColor: dashboardTokens.borderSubtle,
                  background: dashboardTokens.panelGradient,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: dashboardTokens.textMuted }}
                  >
                    Planned integration
                  </p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px]"
                    style={{
                      backgroundColor: dashboardTokens.bgSubtle,
                      color: dashboardTokens.textSecondary,
                      fontFamily: dashboardTokens.fontMono,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6" style={{ color: dashboardTokens.textPrimary }}>
                  {item}
                </p>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          {aside ?? (
            <div
              className="rounded-[22px] border p-5"
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
                className="mt-4 rounded-[16px] border p-3 text-sm"
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
            className="rounded-[22px] border p-5"
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
