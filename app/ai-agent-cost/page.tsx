import { OperationalLedgerPage } from '@/components/site/marketing/OperationalLedgerPage'
import {
  buildOperationalStoryMetadata,
  operationalStories,
} from '@/components/site/marketing/operationalStories'

const story = operationalStories.cost

export const metadata = buildOperationalStoryMetadata(story)

export default function AIAgentCostPage() {
  return <OperationalLedgerPage story={story} />
}
