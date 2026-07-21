import { OperationalLedgerPage } from '@/components/site/marketing/OperationalLedgerPage'
import {
  buildOperationalStoryMetadata,
  operationalStories,
} from '@/components/site/marketing/operationalStories'

const story = operationalStories.controlPlane

export const metadata = buildOperationalStoryMetadata(story)

export default function AIAgentControlPlanePage() {
  return <OperationalLedgerPage story={story} />
}
