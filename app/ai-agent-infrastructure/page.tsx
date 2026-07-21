import { OperationalLedgerPage } from '@/components/site/marketing/OperationalLedgerPage'
import {
  buildOperationalStoryMetadata,
  operationalStories,
} from '@/components/site/marketing/operationalStories'

const story = operationalStories.infrastructure

export const metadata = buildOperationalStoryMetadata(story)

export default function AIAgentInfrastructurePage() {
  return <OperationalLedgerPage story={story} />
}
