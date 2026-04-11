import { picoLessons } from "@/lib/pico/academy";

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
  ].join(" " ).toLowerCase();

  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

export function findPicoSupportMatches(query: string) {
  if (!query.trim()) {
    return [];
  }

  return picoLessons
    .map((lesson) => ({ lesson, score: scoreLesson(query, lesson) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
}
