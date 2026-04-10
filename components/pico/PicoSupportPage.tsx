"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";

import { PicoProductShell } from "@/components/pico/PicoProductShell";
import { usePicoBasePath } from "@/components/pico/PicoPathProvider";
import { picoLessons } from "@/lib/pico/course";
import { buildPicoPath } from "@/lib/pico/routing";

function tokenize(value: string) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
}

function scoreLesson(query: string, lesson: (typeof picoLessons)[number]) {
  const tokens = tokenize(query);
  const haystack = [
    lesson.title,
    lesson.summary,
    lesson.objective,
    lesson.deliverable,
    lesson.tags.join(" "),
    lesson.steps.map((step) => `${step.title} ${step.body} ${step.expected ?? ""}`).join(" "),
    lesson.troubleshooting.map((item) => `${item.symptom} ${item.cause} ${item.fix}`).join(" "),
    lesson.validation.checklist.join(" "),
    lesson.support.escalation,
  ]
    .join(" ")
    .toLowerCase();

  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

export function PicoSupportPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const basePath = usePicoBasePath();
  const matches = useMemo(() => {
    if (!query.trim()) {
      return [];
    }

    return picoLessons
      .map((lesson) => ({ lesson, score: scoreLesson(query, lesson) }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);
  }, [query]);

  return (
    <PicoProductShell
      title="Support"
      description="Grounded tutor guidance only. This page searches the Pico lesson corpus and points back to the exact tutorial, validation rule, or troubleshooting note that matches your issue."
    >
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
        <label className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90" htmlFor="pico-support-query">
          Describe the problem you are hitting
        </label>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row">
          <div className="flex-1 rounded-[1.25rem] border border-white/10 bg-[#0a101b] px-4 py-3">
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-white/45" />
              <input
                id="pico-support-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Examples: alerts keep firing, approval queue is stuck, prompt is improvising"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-white/55">
          The tutor will not invent new commands. It only surfaces content that already exists inside the 12 Pico lessons.
        </p>
      </section>

      {matches.length === 0 ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/65">
          Try asking about scope, prompts, test runs, alerts, approvals, runtime, budgets, or bad runs. Starter prompts:
          <ul className="mt-3 list-disc space-y-2 pl-5 text-white/60">
            <li>My agent keeps acting without enough evidence.</li>
            <li>How do I know whether the runtime or the prompt is failing?</li>
            <li>What should require approval before launch?</li>
          </ul>
        </section>
      ) : null}

      <div className="space-y-5">
        {matches.map(({ lesson, score }) => {
          const lessonHref = buildPicoPath(basePath, `/academy/${lesson.slug}`);
          return (
            <section key={lesson.slug} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Match score {score}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{lesson.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-white/68">{lesson.summary}</p>
                </div>
                <Link href={lessonHref} className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">
                  Open lesson <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                <div className="rounded-[1.25rem] border border-white/10 bg-[#0a101b] p-4">
                  <p className="text-sm font-semibold text-white">Do this now</p>
                  <ul className="mt-3 space-y-3 text-sm leading-7 text-white/65">
                    {lesson.steps.slice(0, 2).map((step) => (
                      <li key={step.title}>
                        <span className="font-semibold text-white">{step.title}:</span> {step.body}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-[#0a101b] p-4">
                  <p className="text-sm font-semibold text-white">Validate before moving on</p>
                  <ul className="mt-3 space-y-3 text-sm leading-7 text-white/65">
                    {lesson.validation.checklist.slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-[#0a101b] p-4">
                  <p className="text-sm font-semibold text-white">If it still fails</p>
                  <ul className="mt-3 space-y-3 text-sm leading-7 text-white/65">
                    {lesson.troubleshooting.slice(0, 2).map((item) => (
                      <li key={item.symptom}>
                        <span className="font-semibold text-white">{item.symptom}:</span> {item.fix}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="mt-4 text-sm text-white/50">Escalate when: {lesson.support.escalation}</p>
            </section>
          );
        })}
      </div>
    </PicoProductShell>
  );
}
