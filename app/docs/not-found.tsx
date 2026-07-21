import Link from 'next/link'

import { SystemState } from '@/components/site/SystemState'

export default function DocsNotFound() {
  return (
    <SystemState
      code="DOC / 404"
      eyebrow="Manual index"
      title="Page not in the ledger."
      description="This documentation route does not exist or moved to a new section of the operator manual."
      detail="Return to the manual index or search for the current source-backed page."
      compact
      actions={<Link href="/docs">Back to docs</Link>}
    />
  );
}
