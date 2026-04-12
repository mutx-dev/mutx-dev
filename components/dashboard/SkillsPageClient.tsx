'use client'

import { useEffect, useMemo, useState } from 'react'

import { ApiRequestError, readJson } from '@/components/app/http'
import {
  LiveAuthRequired,
  LiveEmptyState,
  LiveErrorState,
  LiveLoading,
  LivePanel,
} from '@/components/dashboard/livePrimitives'
import { StatusBadge } from '@/components/dashboard/StatusBadge'

type SkillRecord = {
  id: string
  name: string
  description: string
  author: string
  category: string
  source: string
  installed?: boolean
  is_official?: boolean
  tags?: string[]
  path?: string | null
  canonical_name?: string | null
  upstream_path?: string | null
  upstream_repo?: string | null
  upstream_commit?: string | null
  license?: string | null
  available?: boolean
}

type BundleRecord = {
  id: string
  name: string
  summary: string
  description: string
  skill_ids: string[]
  skill_count: number
  available_skill_count: number
  unavailable_skill_ids: string[]
  recommended_template_id?: string | null
  recommended_swarm_blueprint_id?: string | null
  tags?: string[]
  source?: string
}

type AssistantOverviewEnvelope = {
  has_assistant: boolean
  assistant?: {
    agent_id: string
    name: string
  } | null
}

export function SkillsPageClient() {
  const [loading, setLoading] = useState(true)
  const [authRequired, setAuthRequired] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<SkillRecord[]>([])
  const [bundles, setBundles] = useState<BundleRecord[]>([])
  const [assistantId, setAssistantId] = useState<string | null>(null)
  const [assistantName, setAssistantName] = useState<string | null>(null)
  const [installedIds, setInstalledIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [busySkillId, setBusySkillId] = useState<string | null>(null)
  const [busyBundleId, setBusyBundleId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setAuthRequired(false)

      try {
        const [catalogPayload, bundlePayload, overview] = await Promise.all([
          readJson<SkillRecord[]>('/api/dashboard/clawhub/skills'),
          readJson<BundleRecord[]>('/api/dashboard/clawhub/bundles'),
          readJson<AssistantOverviewEnvelope>('/api/dashboard/assistant/overview'),
        ])

        let nextInstalledIds: string[] = []
        let nextAssistantId: string | null = null
        let nextAssistantName: string | null = null

        if (overview.has_assistant && overview.assistant?.agent_id) {
          nextAssistantId = overview.assistant.agent_id
          nextAssistantName = overview.assistant.name || null
          const installedPayload = await readJson<SkillRecord[]>(
            `/api/dashboard/assistant/${overview.assistant.agent_id}/skills`,
          )
          nextInstalledIds = installedPayload.filter((item) => item.installed).map((item) => item.id)
        }

        if (!cancelled) {
          setCatalog(Array.isArray(catalogPayload) ? catalogPayload : [])
          setBundles(Array.isArray(bundlePayload) ? bundlePayload : [])
          setAssistantId(nextAssistantId)
          setAssistantName(nextAssistantName)
          setInstalledIds(nextInstalledIds)
          setLoading(false)
        }
      } catch (loadError) {
        if (!cancelled) {
          if (
            loadError instanceof ApiRequestError &&
            (loadError.status === 401 || loadError.status === 403)
          ) {
            setAuthRequired(true)
          } else {
            setError(loadError instanceof Error ? loadError.message : 'Failed to load skill catalog')
          }
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredSkills = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return catalog.filter((skill) => {
      if (!needle) return true
      return [skill.id, skill.name, skill.description, skill.category, ...(skill.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [catalog, search])

  async function toggleSkill(skill: SkillRecord) {
    if (!assistantId) return
    setBusySkillId(skill.id)
    setError(null)
    try {
      const method = installedIds.includes(skill.id) ? 'DELETE' : 'POST'
      const response = await fetch(`/api/dashboard/assistant/${assistantId}/skills/${skill.id}`, {
        method,
        credentials: 'include',
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => [])
      if (!response.ok) {
        throw new Error(typeof payload?.detail === 'string' ? payload.detail : 'Failed to update skill')
      }
      const nextInstalled = Array.isArray(payload)
        ? payload.filter((item) => item?.installed).map((item) => String(item.id))
        : []
      setInstalledIds(nextInstalled)
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Failed to update skill')
    } finally {
      setBusySkillId(null)
    }
  }

  async function installBundle(bundleId: string) {
    if (!assistantId) return
    setBusyBundleId(bundleId)
    setError(null)
    try {
      const response = await fetch('/api/dashboard/clawhub/install-bundle', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: assistantId, bundle_id: bundleId }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(
          typeof payload?.detail === 'string' ? payload.detail : 'Failed to install skill bundle',
        )
      }
      const nextInstalled = Array.isArray(payload?.skills)
        ? payload.skills.filter((item: SkillRecord) => item?.installed).map((item: SkillRecord) => item.id)
        : installedIds
      setInstalledIds(nextInstalled)
    } catch (mutationError) {
      setError(
        mutationError instanceof Error ? mutationError.message : 'Failed to install skill bundle',
      )
    } finally {
      setBusyBundleId(null)
    }
  }

  if (loading) return <LiveLoading title='Skills' />
  if (authRequired) {
    return (
      <LiveAuthRequired
        title='Operator session required'
        message='Sign in to browse Orchestra Research imports and wire them into a live assistant.'
      />
    )
  }
  if (error) return <LiveErrorState title='Skill surface unavailable' message={error} />

  return (
    <div className='space-y-4'>
      <LivePanel
        title='Curated bundles'
        meta={`${bundles.length} packs · ${assistantId ? `bound to ${assistantName || 'assistant'}` : 'no assistant bound'}`}
      >
        {bundles.length === 0 ? (
          <LiveEmptyState
            title='No bundles available'
            message='Bundle catalog will appear here once the control plane exposes imported research stacks.'
          />
        ) : (
          <div className='grid gap-4 xl:grid-cols-2'>
            {bundles.map((bundle) => {
              const unavailable = bundle.unavailable_skill_ids?.length || 0
              return (
                <div key={bundle.id} className='rounded-2xl border border-white/10 bg-white/[0.03] p-4'>
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <p className='text-base font-semibold text-white'>{bundle.name}</p>
                      <p className='mt-1 text-sm text-slate-400'>{bundle.summary}</p>
                    </div>
                    <StatusBadge
                      status={unavailable > 0 ? 'warning' : 'healthy'}
                      label={`${bundle.available_skill_count}/${bundle.skill_count} ready`}
                    />
                  </div>
                  <p className='mt-3 text-sm text-slate-300'>{bundle.description}</p>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {(bundle.tags || []).map((tag) => (
                      <span
                        key={`${bundle.id}-${tag}`}
                        className='rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-400'
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className='mt-4 grid gap-2 sm:grid-cols-2'>
                    <div className='rounded-xl border border-white/10 bg-black/20 px-3 py-2'>
                      <p className='text-[10px] uppercase tracking-[0.18em] text-slate-500'>Template</p>
                      <p className='mt-2 text-sm text-white'>
                        {bundle.recommended_template_id || 'Use bundle directly'}
                      </p>
                    </div>
                    <div className='rounded-xl border border-white/10 bg-black/20 px-3 py-2'>
                      <p className='text-[10px] uppercase tracking-[0.18em] text-slate-500'>Swarm blueprint</p>
                      <p className='mt-2 text-sm text-white'>
                        {bundle.recommended_swarm_blueprint_id || 'Single-agent capable'}
                      </p>
                    </div>
                  </div>
                  <div className='mt-4 flex items-center justify-between gap-3'>
                    <p className='text-xs text-slate-500'>
                      {unavailable > 0
                        ? `${unavailable} skills unavailable until runtime sync lands.`
                        : 'All skills in this bundle are ready on the current runtime.'}
                    </p>
                    <button
                      type='button'
                      onClick={() => void installBundle(bundle.id)}
                      disabled={!assistantId || busyBundleId === bundle.id}
                      className='rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      {busyBundleId === bundle.id ? 'Installing…' : 'Install bundle'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </LivePanel>

      <LivePanel title='Skill catalog' meta={`${filteredSkills.length} visible`}> 
        <div className='mb-4 flex flex-wrap items-center gap-3'>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Search skills, tags, categories…'
            className='w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-600 md:max-w-md'
          />
          <div className='rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400'>
            {assistantId ? `Assistant bound: ${assistantName || assistantId}` : 'No assistant bound'}
          </div>
        </div>

        {filteredSkills.length === 0 ? (
          <LiveEmptyState
            title='No skills matched'
            message='Try a broader search or clear the current filters.'
          />
        ) : (
          <div className='grid gap-3 xl:grid-cols-2'>
            {filteredSkills.map((skill) => {
              const installed = installedIds.includes(skill.id)
              const available = skill.available !== false
              return (
                <div key={skill.id} className='rounded-2xl border border-white/10 bg-white/[0.02] p-4'>
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <p className='text-base font-semibold text-white'>{skill.name}</p>
                        <span className='rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-400'>
                          {skill.category}
                        </span>
                      </div>
                      <p className='mt-1 text-sm text-slate-400'>{skill.description}</p>
                    </div>
                    <StatusBadge
                      status={installed ? 'healthy' : available ? 'idle' : 'warning'}
                      label={installed ? 'Installed' : available ? 'Ready' : 'Needs sync'}
                    />
                  </div>

                  <div className='mt-3 flex flex-wrap gap-2'>
                    {(skill.tags || []).slice(0, 5).map((tag) => (
                      <span
                        key={`${skill.id}-${tag}`}
                        className='rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-500'
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className='mt-4 grid gap-2 sm:grid-cols-2'>
                    <div className='rounded-xl border border-white/10 bg-black/20 px-3 py-2'>
                      <p className='text-[10px] uppercase tracking-[0.18em] text-slate-500'>Source</p>
                      <p className='mt-2 text-sm text-white'>{skill.source}</p>
                    </div>
                    <div className='rounded-xl border border-white/10 bg-black/20 px-3 py-2'>
                      <p className='text-[10px] uppercase tracking-[0.18em] text-slate-500'>Runtime path</p>
                      <p className='mt-2 truncate text-sm text-white'>{skill.path || 'Not synced yet'}</p>
                    </div>
                  </div>

                  <div className='mt-4 flex items-center justify-between gap-3'>
                    <p className='text-xs text-slate-500'>
                      {skill.upstream_commit
                        ? `Pinned upstream commit ${skill.upstream_commit.slice(0, 7)} · ${skill.license || 'license unknown'}`
                        : skill.author}
                    </p>
                    <button
                      type='button'
                      onClick={() => void toggleSkill(skill)}
                      disabled={!assistantId || !available || busySkillId === skill.id}
                      className='rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      {busySkillId === skill.id ? 'Working…' : installed ? 'Uninstall' : 'Install'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </LivePanel>
    </div>
  )
}
