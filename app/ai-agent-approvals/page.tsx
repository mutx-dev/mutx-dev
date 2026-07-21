import { OperationalLedgerPage } from '@/components/site/marketing/OperationalLedgerPage'
import {
  buildOperationalStoryMetadata,
  operationalStories,
} from '@/components/site/marketing/operationalStories'

const story = operationalStories.approvals

export const metadata = buildOperationalStoryMetadata(story)

export default function AIAgentApprovalsPage() {
  return <OperationalLedgerPage story={story} />
}
