import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { withErrorHandling, notFound } from '@/app/api/_lib/errors'

export const dynamic = 'force-dynamic'

type QueueItem = {
  id?: string
  title?: string
  status?: string
  lane?: string
  runner?: string
  area?: string
  priority?: string
  notes?: Array<{ ts?: string; message?: string }>
}

function isLocalRequest(request: NextRequest) {
  const host = request.nextUrl.hostname
  return process.env.NODE_ENV === 'development' || host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function readJsonlTail(filePath: string, limit: number) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const lines = raw.split('\n').filter(Boolean)
    return lines.slice(-limit).map((line) => {
      try {
        return JSON.parse(line)
      } catch {
        return { status: 'error', summary: line }
      }
    })
  } catch {
    return []
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    if (!isLocalRequest(request)) {
      return notFound('Autonomy dashboard')
    }

    const repoRoot = process.env.MUTX_REPO_ROOT || '/Users/fortune/MUTX'
    const autonomyDir = path.join(repoRoot, '.autonomy')

    const [daemonStatus, laneState, fleet, generatedTasks, queue, reports] = await Promise.all([
      readJsonFile(path.join(autonomyDir, 'daemon-status.json'), {}),
      readJsonFile(path.join(autonomyDir, 'lane-state.json'), { lanes: {} }),
      readJsonFile(path.join(autonomyDir, 'fleet.json'), { roles: [] }),
      readJsonFile(path.join(autonomyDir, 'generated-tasks.json'), []),
      readJsonFile<{ items: QueueItem[] }>(path.join(repoRoot, 'mutx-engineering-agents/dispatch/action-queue.json'), { items: [] }),
      readJsonlTail(path.join(repoRoot, 'reports/autonomy-status.jsonl'), 20),
    ])

    const items = Array.isArray(queue.items) ? queue.items : []
    const counts = items.reduce<Record<string, number>>((acc, item) => {
      const key = item.status || 'unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const activeRunners = Array.isArray((daemonStatus as { active_runners?: unknown }).active_runners)
      ? ((daemonStatus as { active_runners: unknown[] }).active_runners as unknown[])
      : []

    const payload = {
      status: 'ok',
      daemon: daemonStatus,
      lanes: laneState,
      fleet,
      generatedTasks,
      queue: {
        counts,
        queued: items.filter((item) => item.status === 'queued').slice(0, 20),
        running: items.filter((item) => item.status === 'running').slice(0, 20),
        parked: items.filter((item) => item.status === 'parked').slice(0, 20),
        completed: items.filter((item) => item.status === 'completed').slice(0, 10),
      },
      activeRunners,
      reports,
      repoRoot,
    }

    return NextResponse.json(payload, { status: 200 })
  })(request)
}
