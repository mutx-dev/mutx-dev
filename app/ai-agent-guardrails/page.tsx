import { OperationalLedgerPage } from '@/components/site/marketing/OperationalLedgerPage'
import {
  buildOperationalStoryMetadata,
  operationalStories,
} from '@/components/site/marketing/operationalStories'

const story = operationalStories.guardrails

export const metadata = buildOperationalStoryMetadata(story)

export default function AIAgentGuardrailsPage() {
  return <OperationalLedgerPage story={story} />
}
