'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

import { cn } from '@/lib/utils'

type QuickstartTab = 'hosted' | 'local' | 'api'

type QuickstartBlock = {
  id: string
  label: string
  hint: string
  script: string
}

type QuickstartContent = {
  label: string
  intro: string
  environment: string
  mode: string
  footer: string
  blocks: QuickstartBlock[]
}

const tabs: QuickstartTab[] = ['hosted', 'local', 'api']

const tabContent: Record<QuickstartTab, QuickstartContent> = {
  hosted: {
    label: 'Hosted operator',
    intro: 'Install. Auth. Deploy `Personal Assistant`.',
    environment: 'hosted control plane',
    mode: 'assistant first',
    footer: 'Primary path. Real assistant. No empty shell.',
    blocks: [
      {
        id: 'installer',
        label: 'Install',
        hint: 'Install the CLI.',
        script: 'curl -fsSL https://mutx.dev/install.sh | bash',
      },
      {
        id: 'setup',
        label: 'Deploy Personal Assistant',
        hint: 'Set API, auth, deploy.',
        script: `mutx setup hosted
mutx doctor
mutx assistant overview`,
      },
    ],
  },
  local: {
    label: 'Local contributor',
    intro: 'Run the stack. Launch the same assistant on localhost.',
    environment: 'repo + localhost',
    mode: 'local control plane',
    footer: 'Build MUTX locally. Land on the same operator loop.',
    blocks: [
      {
        id: 'stack',
        label: 'Start local stack',
        hint: 'Boot services.',
        script: `make dev-up
make dev-logs`,
      },
      {
        id: 'setup',
        label: 'Register + deploy',
        hint: 'Create operator, launch assistant.',
        script: `mutx setup local
mutx doctor
mutx tui`,
      },
    ],
  },
  api: {
    label: 'API contract',
    intro: 'One mounted contract: `/v1/*`.',
    environment: '/v1',
    mode: 'control plane contract',
    footer: 'Docs, web, CLI, and TUI stay on the same rails.',
    blocks: [
      {
        id: 'auth',
        label: 'Authenticate',
        hint: 'Get an access token.',
        script: `BASE_URL=http://localhost:8000/v1

curl -X POST "$BASE_URL/auth/register" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","name":"You","password":"StrongPass1!"}'`,
      },
      {
        id: 'starter',
        label: 'Starter deployment',
        hint: 'Create assistant + deployment.',
        script: `curl -X POST "$BASE_URL/templates/personal_assistant/deploy" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Personal Assistant","replicas":1}'`,
      },
      {
        id: 'inspect',
        label: 'Inspect assistant surfaces',
        hint: 'Check overview + sessions.',
        script: `curl "$BASE_URL/assistant/overview" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl "$BASE_URL/sessions" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`,
      },
    ],
  },
}

type QuickstartSnippetProps = {
  block: QuickstartBlock
  copied: boolean
  onCopy: (block: QuickstartBlock) => void
}

function QuickstartSnippet({ block, copied, onCopy }: QuickstartSnippetProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#0a1424] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{block.label}</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{block.hint}</p>
        </div>
        <button
          type="button"
          onClick={() => onCopy(block)}
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-xl border transition',
            copied
              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
              : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-400/25 hover:bg-cyan-400/10 hover:text-cyan-100',
          )}
          aria-label={copied ? `${block.label} copied` : `Copy ${block.label} commands`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#050b16]">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 font-mono normal-case tracking-normal text-slate-400">bash {block.id}</span>
        </div>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 px-4 py-4">
          <span className="pt-0.5 font-mono text-sm text-cyan-300">$</span>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-7 text-slate-100">
            {block.script}
          </pre>
        </div>
      </div>
    </div>
  )
}

export function QuickstartTabs() {
  const [activeTab, setActiveTab] = useState<QuickstartTab>('hosted')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const active = tabContent[activeTab]

  async function handleCopy(block: QuickstartBlock) {
    const key = `${activeTab}:${block.id}`

    try {
      await navigator.clipboard.writeText(block.script)
      setCopiedKey(key)
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current))
      }, 1400)
    } catch {
      setCopiedKey(null)
    }
  }

  return (
    <div className="overflow-hidden rounded-[30px] border border-[#1b2740] bg-[linear-gradient(180deg,#0a1322_0%,#070d18_100%)] text-white shadow-[0_30px_90px_rgba(2,6,23,0.4)]">
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-2" role="tablist" aria-label="MUTX quickstart modes">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-semibold transition',
                  activeTab === tab
                    ? 'border-cyan-400/20 bg-cyan-400 text-slate-950 shadow-[0_14px_34px_rgba(34,211,238,0.28)]'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/15 hover:text-slate-100',
                )}
              >
                {tabContent[tab].label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">{active.environment}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">{active.mode}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-5 sm:py-6">
        <p className="max-w-3xl text-base leading-7 text-slate-300">{active.intro}</p>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {active.blocks.map((block) => (
            <QuickstartSnippet
              key={block.id}
              block={block}
              copied={copiedKey === `${activeTab}:${block.id}`}
              onCopy={handleCopy}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#08101d] px-4 py-4 text-sm leading-6 text-slate-400 sm:px-5">
        {active.footer}
      </div>
    </div>
  )
}
