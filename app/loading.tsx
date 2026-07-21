import { SystemState } from '@/components/site/SystemState'

export default function Loading() {
  return (
    <SystemState
      code="RUN / PENDING"
      eyebrow="Control plane handoff"
      title="Reading the system."
      description="MUTX is resolving the route, loading its live state, and keeping the handoff on the record."
      detail="The playhead advances when the requested surface is ready."
      role="status"
      live
    />
  )
}
