interface DashboardSectionPageProps {
  title: string;
  description: string;
  checks: string[];
}

export function DashboardSectionPage({
  title,
  description,
  checks,
}: DashboardSectionPageProps) {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {checks.map((item) => (
          <article
            key={item}
            className="rounded-xl border border-white/10 bg-black/20 p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
              Planned
            </p>
            <p className="mt-2 text-sm text-slate-200">{item}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
