'use client'

import { useEffect, useState } from 'react'

import { ApiRequestError, readJson } from '@/components/app/http'
import {
  LiveAuthRequired,
  LiveEmptyState,
  LiveErrorState,
  LiveLoading,
  LivePanel,
  asDashboardStatus,
  formatRelativeTime,
} from '@/components/dashboard/livePrimitives'
import { StatusBadge } from '@/components/dashboard/StatusBadge'

import type { components } from '@/app/types/api'

type Swarm = components['schemas']['SwarmResponse']
type SwarmList = components['schemas']['SwarmListResponse']

type SwarmBlueprint = {
  id: string
  name: string
  summary: string
  description: string
  recommended_min_agents: number
  recommended_max_agents: number
  coordination_notes: string
  tags: string[]
  roles: Array<{
    id: string
    title: string
    bundle_id: string
    goal: string
  }>
}

export function SwarmsPageClient() {
  const [loading, setLoading] = useState(true)
  const [authRequired, setAuthRequired] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [swarms, setSwarms] = useState<Swarm[]>([])
  const [blueprints, setBlueprints] = useState<SwarmBlueprint[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setAuthRequired(false)

      try {
        const [swarmResponse, blueprintResponse] = await Promise.all([
          readJson<SwarmList>('/api/dashboard/swarms?limit=16'),
          readJson<SwarmBlueprint[]>('/api/dashboard/swarms/blueprints'),
        ])
        if (!cancelled) {
          setSwarms(swarmResponse.items ?? [])
          setBlueprints(Array.isArray(blueprintResponse) ? blueprintResponse : [])
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
            setError(loadError instanceof Error ? loadError.message : 'Failed to load swarms')
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

  if (loading) return <LiveLoading title='Swarms' />
  if (authRequired) {
    return (
      <LiveAuthRequired
        title='Operator session required'
        message='Sign in to inspect grouped agent swarms and replica posture.'
      />
    )
  }
  if (error) return <LiveErrorState title='Swarm surface unavailable' message={error} />

  return (
    <div className='space-y-4'>
      <LivePanel title='Curated blueprints' meta={`${blueprints.length} orchestration presets`}>
        {blueprints.length === 0 ? (
          <LiveEmptyState
            title='No blueprints available yet'
            message='Blueprint catalog will appear here once orchestration presets are published.'
          />
        ) : (
          <div className='grid gap-4 xl:grid-cols-2'>
            {blueprints.map((blueprint) => (
              <div key={blueprint.id} className='rounded-2xl border border-white/10 bg-white/[0.03] p-4'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='text-base font-semibold text-white'>{blueprint.name}</p>
                    <p className='mt-1 text-sm text-slate-400'>{blueprint.summary}</p>
                  </div>
                  <StatusBadge
                    status='healthy'
                    label={`${blueprint.recommended_min_agents}-${blueprint.recommended_max_agents} agents`}
                  />
                </div>
                <p className='mt-3 text-sm text-slate-300'>{blueprint.description}</p>
                <div className='mt-4 space-y-2'>
                  {blueprint.roles.map((role) => (
                    <div key={`${blueprint.id}-${role.id}`} className='rounded-xl border border-white/10 bg-black/20 px-3 py-2.5'>
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <p className='text-sm font-medium text-white'>{role.title}</p>
                        <span className='rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-400'>
                          {role.bundle_id}
                        </span>
                      </div>
                      <p className='mt-1 text-xs text-slate-500'>{role.goal}</p>
                    </div>
                  ))}
                </div>
                <p className='mt-4 text-xs text-slate-500'>{blueprint.coordination_notes}</p>
              </div>
            ))}
          </div>
        )}
      </LivePanel>

      <LivePanel title='Swarm topology' meta={`${swarms.length} groups`}>
        {swarms.length === 0 ? (
          <LiveEmptyState
            title='No swarms configured yet'
            message='Create grouped agent swarms once you need coordinated replica posture instead of single-deployment control.'
          />
        ) : (
          <div className='grid gap-4 xl:grid-cols-2'>
            {swarms.map((swarm) => (
              <div key={swarm.id} className='rounded-2xl border border-white/10 bg-white/[0.02] p-4'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='truncate text-base font-semibold text-white'>{swarm.name}</p>
                    <p className='mt-1 text-sm text-slate-400'>
                      {swarm.description || 'Grouped agent coordination surface'}
                    </p>
                  </div>
                  <StatusBadge
                    status={asDashboardStatus(swarm.agents.some((agent) => agent.replicas === 0) ? 'warning' : 'healthy')}
                    label={`${swarm.agents.length} agents`}
                  />
                </div>

                <div className='mt-4 grid gap-2 sm:grid-cols-2'>
                  <div className='rounded-xl border border-white/10 bg-black/20 px-3 py-2'>
                    <p className='text-[10px] uppercase tracking-[0.18em] text-slate-500'>Replica guardrail</p>
                    <p className='mt-2 text-sm text-white'>
                      {swarm.min_replicas} min · {swarm.max_replicas} max
                    </p>
                  </div>
                  <div className='rounded-xl border border-white/10 bg-black/20 px-3 py-2'>
                    <p className='text-[10px] uppercase tracking-[0.18em] text-slate-500'>Updated</p>
                    <p className='mt-2 text-sm text-white'>{formatRelativeTime(swarm.updated_at)}</p>
                  </div>
                </div>

                <div className='mt-4 space-y-2'>
                  {swarm.agents.map((agent) => (
                    <div key={agent.agent_id} className='flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5'>
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-medium text-white'>{agent.agent_name}</p>
                        <p className='text-xs text-slate-500'>{agent.agent_id.slice(0, 8)}</p>
                      </div>
                      <div className='flex items-center gap-3'>
                        <span className='text-xs text-slate-400'>{agent.replicas} replicas</span>
                        <StatusBadge status={asDashboardStatus(agent.status)} label={agent.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </LivePanel>
    </div>
  )
}
