import { OperationalLedgerPage } from '@/components/site/marketing/OperationalLedgerPage'
import {
  buildOperationalStoryMetadata,
  operationalStories,
} from '@/components/site/marketing/operationalStories'

const story = operationalStories.reliability

export const metadata = buildOperationalStoryMetadata(story)

export default function AIAgentReliabilityPage() {
  return <OperationalLedgerPage story={story} />
}
