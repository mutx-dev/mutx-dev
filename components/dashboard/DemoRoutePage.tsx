import { FlaskConical } from "lucide-react";

import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { LivePanel } from "@/components/dashboard/livePrimitives";

export function DemoRoutePage({
  title,
  description,
  badge,
  notes,
}: {
  title: string;
  description: string;
  badge: string;
  notes: string[];
}) {
  return (
    <div className="space-y-4">
      <RouteHeader
        title={title}
        description={description}
        icon={FlaskConical}
        iconTone="text-cyan-300 bg-cyan-400/10"
        badge={badge}
        hint={{
          tone: "comingSoon",
          detail:
            "This route is intentionally staged. The layout is real, but actions stay hidden until the backend contract ships end to end.",
        }}
        stats={[
          { label: "State", value: "Integration pending", tone: "warning" },
          { label: "Data", value: "Shell only" },
        ]}
      />

      <LivePanel title={`${title} surface`} meta="integration queue">
        <div className="grid gap-3 lg:grid-cols-3">
          {notes.map((note, index) => (
            <article
              key={note}
              className="rounded-[18px] border p-4"
              style={{
                borderColor: "rgba(123, 144, 166, 0.18)",
                background:
                  "linear-gradient(180deg, rgba(18,24,32,0.98) 0%, rgba(11,15,21,0.98) 100%)",
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Planned signal {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{note}</p>
            </article>
          ))}
        </div>
      </LivePanel>
    </div>
  );
}
