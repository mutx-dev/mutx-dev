'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

import { cn } from '@/lib/utils'

type QuickstartTab = 'hosted' | 'local' | 'api'

type QuickstartBlock = {
  id: string
  label: string
  script: string
}

type QuickstartContent = {
  label: string
  environment: string
  mode: string
  blocks: QuickstartBlock[]
}

const tabs: QuickstartTab[] = ['hosted', 'local', 'api']

const tabContent: Record<QuickstartTab, QuickstartContent> = {
  hosted: {
    label: 'Hosted operator',
    environment: 'hosted control plane',
    mode: 'assistant first',
    blocks: [
      {
        id: 'install',
        label: 'Install',
        script: 'curl -fsSL https://mutx.dev/install.sh | bash',
      },
      {
        id: 'deploy',
        label: 'Deploy Personal Assistant',
        script: `mutx setup hosted --provider openclaw --install-openclaw
mutx doctor
mutx runtime inspect openclaw
mutx assistant overview`,
      },
    ],
  },
  local: {
    label: 'Local contributor',
    environment: 'repo + localhost',
    mode: 'local operator loop',
    blocks: [
      {
        id: 'stack',
        label: 'Start local stack',
        script: `make dev-up
make dev-logs`,
      },
      {
        id: 'deploy',
        label: 'Deploy Personal Assistant',
        script: `mutx setup local --provider openclaw --install-openclaw
mutx doctor
mutx runtime inspect openclaw
mutx tui`,
      },
    ],
  },
  api: {
    label: 'API contract',
    environment: '/v1 contract',
    mode: 'no browser required',
    blocks: [
      {
        id: 'auth',
        label: 'Authenticate',
        script: `BASE_URL=http://localhost:8000/v1

curl -X POST "$BASE_URL/auth/register" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","name":"You","password":"StrongPass1!"}'`,
      },
      {
        id: 'deploy',
        label: 'Starter deployment',
        script: `curl -X POST "$BASE_URL/templates/personal_assistant/deploy" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Personal Assistant","replicas":1}'`,
      },
      {
        id: 'inspect',
        label: 'Inspect state',
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
  wide?: boolean
}

function QuickstartSnippet({
  block,
  copied,
  onCopy,
  wide = false,
}: QuickstartSnippetProps) {
  return (
    <article className={cn('site-quickstart-card', wide && 'lg:col-span-2')}>
      <div className="site-quickstart-card-head">
        <div>
          <p className="font-[family:var(--font-landing-mono)] text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-500">
            {block.label}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onCopy(block)}
          className={cn(
            'site-quickstart-copy',
            copied &&
              'border-emerald-400/20 bg-emerald-400/10 text-emerald-200 hover:border-emerald-400/20 hover:bg-emerald-400/10 hover:text-emerald-200',
          )}
          aria-label={copied ? `${block.label} copied` : `Copy ${block.label} commands`}
        >
          {copied ? <Check className="h-4.5 w-4.5" /> : <Copy className="h-4.5 w-4.5" />}
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#030913] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-slate-500">
          <span className="site-quickstart-dot site-quickstart-dot-red" />
          <span className="site-quickstart-dot site-quickstart-dot-amber" />
          <span className="site-quickstart-dot site-quickstart-dot-green" />
          <span className="ml-3 font-[family:var(--font-landing-mono)] text-[0.7rem] normal-case tracking-[0.08em] text-slate-400">
            bash {block.id}
          </span>
        </div>
        <div className="site-quickstart-snippet">
          <span className="site-quickstart-prompt">$</span>
          <pre>{block.script}</pre>
        </div>
      </div>
    </article>
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
    <div className="site-quickstart-shell text-white">
      <div className="site-quickstart-toolbar">
        <div className="site-quickstart-toolbar-main">
          <div className="site-quickstart-dots" aria-hidden="true">
            <span className="site-quickstart-dot site-quickstart-dot-red" />
            <span className="site-quickstart-dot site-quickstart-dot-amber" />
            <span className="site-quickstart-dot site-quickstart-dot-green" />
          </div>

          <div
            className="site-quickstart-tabrail"
            role="tablist"
            aria-label="MUTX quickstart modes"
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className="site-quickstart-tab"
                data-active={activeTab === tab}
              >
                {tabContent[tab].label}
              </button>
            ))}
          </div>
        </div>

        <div className="site-quickstart-context">
          <span className="site-quickstart-context-pill">
            {active.environment}
          </span>
          <span className="site-quickstart-context-pill site-quickstart-context-pill-active">
            {active.mode}
          </span>
        </div>
      </div>

      <div className="site-quickstart-body">
        <div className="site-quickstart-grid">
          {active.blocks.map((block, index) => (
            <QuickstartSnippet
              key={block.id}
              block={block}
              copied={copiedKey === `${activeTab}:${block.id}`}
              onCopy={handleCopy}
              wide={active.blocks.length === 3 && index === active.blocks.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
