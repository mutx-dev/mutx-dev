import { OperationalLedgerPage } from '@/components/site/marketing/OperationalLedgerPage'
import {
  buildOperationalStoryMetadata,
  operationalStories,
} from '@/components/site/marketing/operationalStories'

const story = operationalStories.auditLogs

export const metadata = buildOperationalStoryMetadata(story)

export default function AIAgentAuditLogsPage() {
  return <OperationalLedgerPage story={story} />
}
