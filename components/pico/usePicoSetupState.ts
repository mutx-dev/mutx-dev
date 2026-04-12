'use client'

import { useCallback, useEffect, useState } from 'react'

export type PicoSetupStep = {
  id: string
  title: string
  completed: boolean
}

export type PicoProviderOption = {
  id: string
  label: string
  summary: string
  enabled: boolean
  cue?: string
}

export type PicoOnboardingState = {
  provider: string
  status: string
  current_step: string
  completed_steps: string[]
  failed_step?: string | null
  last_error?: string | null
  checklist_dismissed?: boolean
  assistant_name?: string | null
  assistant_id?: string | null
  workspace?: string | null
  gateway_url?: string | null
  updated_at?: string | null
  steps: PicoSetupStep[]
  providers?: PicoProviderOption[]
}

export type PicoRuntimeBinding = {
  assistant_id?: string | null
  assistant_name?: string | null
  workspace?: string | null
  model?: string | null
}

export type PicoRuntimeGateway = {
  status?: string | null
  doctor_summary?: string | null
  [key: string]: unknown
}

export type PicoRuntimeSnapshot = {
  provider: string
  label: string
  status: string
  cue?: string | null
  install_method?: string | null
  runtime_key?: string | null
  gateway_url?: string | null
  gateway?: PicoRuntimeGateway
  current_binding?: PicoRuntimeBinding | null
  version?: string | null
  binary_path?: string | null
  config_path?: string | null
  state_dir?: string | null
  home_path?: string | null
  provider_root?: string | null
  last_seen_at?: string | null
  last_synced_at?: string | null
  stale: boolean
  stale_after_seconds?: number
  binding_count: number
  bindings: PicoRuntimeBinding[]
}

type PicoSetupState = {
  loading: boolean
  error: string | null
  pendingAction: string | null
  onboarding: PicoOnboardingState | null
  runtime: PicoRuntimeSnapshot | null
  refresh: () => Promise<void>
  completeCurrentStep: () => Promise<void>
  dismissChecklist: () => Promise<void>
  completeAll: () => Promise<void>
  resetWizard: () => Promise<void>
  updateRuntimeSnapshot: (payload: Partial<PicoRuntimeSnapshot>) => Promise<void>
}

async function readJsonOrNull(response: Response) {
  return response.json().catch(() => null)
}

export function usePicoSetupState(enabled: boolean): PicoSetupState {
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [onboarding, setOnboarding] = useState<PicoOnboardingState | null>(null)
  const [runtime, setRuntime] = useState<PicoRuntimeSnapshot | null>(null)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      setError(null)
      setPendingAction(null)
      setOnboarding(null)
      setRuntime(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [onboardingResponse, runtimeResponse] = await Promise.all([
        fetch('/api/pico/onboarding?provider=openclaw', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/pico/runtime/openclaw', { credentials: 'include', cache: 'no-store' }),
      ])

      if (!onboardingResponse.ok) {
        const payload = await readJsonOrNull(onboardingResponse)
        throw new Error(
          typeof payload?.detail === 'string' && payload.detail
            ? payload.detail
            : 'Failed to load Pico onboarding state',
        )
      }

      if (!runtimeResponse.ok) {
        const payload = await readJsonOrNull(runtimeResponse)
        throw new Error(
          typeof payload?.detail === 'string' && payload.detail
            ? payload.detail
            : 'Failed to load Pico runtime state',
        )
      }

      const [onboardingPayload, runtimePayload] = await Promise.all([
        onboardingResponse.json(),
        runtimeResponse.json(),
      ])

      setOnboarding(onboardingPayload as PicoOnboardingState)
      setRuntime(runtimePayload as PicoRuntimeSnapshot)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load Pico setup state')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  const runOnboardingAction = useCallback(
    async (
      action: 'complete_step' | 'dismiss_checklist' | 'complete' | 'reset',
      options?: {
        step?: string
        payload?: Record<string, unknown>
      },
    ) => {
      if (!enabled) {
        return
      }

      setPendingAction(action)
      setError(null)

      try {
        const response = await fetch('/api/pico/onboarding', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            provider: onboarding?.provider ?? 'openclaw',
            step: options?.step,
            payload: options?.payload,
          }),
        })

        if (!response.ok) {
          const payload = await readJsonOrNull(response)
          throw new Error(
            typeof payload?.detail === 'string' && payload.detail
              ? payload.detail
              : 'Failed to update Pico onboarding state',
          )
        }

        await refresh()
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : 'Failed to update Pico setup state')
      } finally {
        setPendingAction(null)
      }
    },
    [enabled, onboarding?.provider, refresh],
  )

  const completeCurrentStep = useCallback(async () => {
    if (!onboarding?.current_step) {
      return
    }

    await runOnboardingAction('complete_step', {
      step: onboarding.current_step,
    })
  }, [onboarding?.current_step, runOnboardingAction])

  const dismissChecklist = useCallback(async () => {
    await runOnboardingAction('dismiss_checklist')
  }, [runOnboardingAction])

  const completeAll = useCallback(async () => {
    await runOnboardingAction('complete')
  }, [runOnboardingAction])

  const resetWizard = useCallback(async () => {
    await runOnboardingAction('reset')
  }, [runOnboardingAction])

  const updateRuntimeSnapshot = useCallback(
    async (payload: Partial<PicoRuntimeSnapshot>) => {
      if (!enabled) {
        return
      }

      setPendingAction('runtime')
      setError(null)

      const provider = payload.provider ?? runtime?.provider ?? onboarding?.provider ?? 'openclaw'

      const nextBindings =
        payload.bindings ??
        runtime?.bindings ??
        []

      const body = {
        provider,
        runtime_key: payload.runtime_key ?? runtime?.runtime_key ?? provider,
        label: payload.label ?? runtime?.label ?? 'OpenClaw',
        cue: payload.cue ?? runtime?.cue ?? null,
        status: payload.status ?? runtime?.status ?? 'unknown',
        install_method: payload.install_method ?? runtime?.install_method ?? null,
        gateway: payload.gateway ?? runtime?.gateway ?? {},
        gateway_url: payload.gateway_url ?? runtime?.gateway_url ?? null,
        current_binding: payload.current_binding ?? runtime?.current_binding ?? null,
        binding_count:
          typeof payload.binding_count === 'number'
            ? payload.binding_count
            : Array.isArray(nextBindings)
              ? nextBindings.length
              : runtime?.binding_count ?? 0,
        bindings: nextBindings,
        binary_path: payload.binary_path ?? runtime?.binary_path ?? null,
        config_path: payload.config_path ?? runtime?.config_path ?? null,
        state_dir: payload.state_dir ?? runtime?.state_dir ?? null,
        home_path: payload.home_path ?? runtime?.home_path ?? null,
        provider_root: payload.provider_root ?? runtime?.provider_root ?? null,
        version: payload.version ?? runtime?.version ?? null,
        last_seen_at: payload.last_seen_at ?? runtime?.last_seen_at ?? null,
      }

      try {
        const response = await fetch(`/api/pico/runtime/${encodeURIComponent(provider)}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          const responsePayload = await readJsonOrNull(response)
          throw new Error(
            typeof responsePayload?.detail === 'string' && responsePayload.detail
              ? responsePayload.detail
              : 'Failed to update Pico runtime state',
          )
        }

        const responsePayload = (await response.json()) as PicoRuntimeSnapshot
        setRuntime(responsePayload)
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : 'Failed to update Pico runtime state')
      } finally {
        setPendingAction(null)
      }
    },
    [enabled, onboarding?.provider, runtime],
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    loading,
    error,
    pendingAction,
    onboarding,
    runtime,
    refresh,
    completeCurrentStep,
    dismissChecklist,
    completeAll,
    resetWizard,
    updateRuntimeSnapshot,
  }
}
