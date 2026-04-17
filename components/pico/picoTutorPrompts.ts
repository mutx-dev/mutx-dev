import { type PicoLesson } from '@/lib/pico/academy'

export function getPicoTutorPromptChips(
  selectedLesson: PicoLesson | null,
  fallbackPrompts: readonly string[],
) {
  if (selectedLesson) {
    return []
  }

  return [...fallbackPrompts]
}
