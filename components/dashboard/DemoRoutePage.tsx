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
        stats={[
          { label: "State", value: "Demo mode", tone: "warning" },
          { label: "Data", value: "Waiting on backend" },
        ]}
      />

      <LivePanel title={`${title} status`} meta="demo mode">
        <div className="grid gap-3 lg:grid-cols-3">
          {notes.map((note, index) => (
            <article key={note} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Waiting on contract {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{note}</p>
            </article>
          ))}
        </div>
      </LivePanel>
    </div>
  );
}
