import { OperationalLedgerPage } from '@/components/site/marketing/OperationalLedgerPage'
import {
  buildOperationalStoryMetadata,
  operationalStories,
} from '@/components/site/marketing/operationalStories'

const story = operationalStories.deployment

export const metadata = buildOperationalStoryMetadata(story)

export default function AIAgentDeploymentPage() {
  return <OperationalLedgerPage story={story} />
}
