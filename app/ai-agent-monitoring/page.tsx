import { OperationalLedgerPage } from '@/components/site/marketing/OperationalLedgerPage'
import {
  buildOperationalStoryMetadata,
  operationalStories,
} from '@/components/site/marketing/operationalStories'

const story = operationalStories.monitoring

export const metadata = buildOperationalStoryMetadata(story)

export default function AIAgentMonitoringPage() {
  return <OperationalLedgerPage story={story} />
}
