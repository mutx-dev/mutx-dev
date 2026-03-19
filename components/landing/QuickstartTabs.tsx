'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

type QuickstartTab = 'one-liner' | 'homebrew' | 'hackable' | 'api'

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

const tabs: QuickstartTab[] = ['one-liner', 'homebrew', 'hackable', 'api']

const tabContent: Record<QuickstartTab, QuickstartContent> = {
  'one-liner': {
    label: 'One-liner',
    intro: '# One paste. Homebrew handles the install. The TUI opens when it is done.',
    environment: 'macOS',
    mode: 'TUI first',
    footer:
      'macOS-first. Uses the published Homebrew tap, force-links mutx if an older shim already exists, runs mutx status, and launches mutx tui in local-only mode if you have not authenticated yet.',
    blocks: [
      {
        id: 'installer',
        label: 'Installer',
        hint: 'The fastest path from zero to the operator shell.',
        script: 'curl -fsSL https://mutx.dev/install.sh | bash',
      },
    ],
  },
  homebrew: {
    label: 'Homebrew',
    intro: '# Manual, explicit, and still quick. Good if you want to see every install step.',
    environment: 'Tap',
    mode: 'Manual',
    footer:
      'Best for connecting the CLI and TUI to an existing MUTX control plane. Shared state stays in ~/.mutx/config.json and mutx status remains the non-network smoke check.',
    blocks: [
      {
        id: 'install',
        label: 'Install',
        hint: 'Tap, install, relink, and make sure your shell points at the Brew binary.',
        script: `brew tap mutx-dev/homebrew-tap
brew install mutx
brew link --overwrite mutx
hash -r`,
      },
      {
        id: 'launch',
        label: 'Launch',
        hint: 'Verify the CLI, authenticate against your control plane, and open the TUI.',
        script: `mutx --help
mutx status
mutx login --email you@example.com
mutx tui`,
      },
    ],
  },
  hackable: {
    label: 'Hackable',
    intro: '# For people who want the repo, the local stack, and the operator loop under one roof.',
    environment: 'Repo',
    mode: 'Local stack',
    footer:
      'Best for contributors. Site and app shell run on localhost:3000, the FastAPI control plane runs on localhost:8000, and the CLI plus TUI share auth via ~/.mutx/config.json.',
    blocks: [
      {
        id: 'clone-install',
        label: 'Clone + install',
        hint: 'Set up the repo, Node dependencies, Python environment, and CLI extras.',
        script: `git clone https://github.com/mutx-dev/mutx-dev.git
cd mutx-dev
npm install
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ".[dev,tui]"`,
      },
      {
        id: 'boot-open',
        label: 'Boot + open',
        hint: 'Start the stack, create the local auth session, seed the system, then open the operator terminal.',
        script: `make dev
make test-auth
mutx login --email test@local.dev --password TestPass123!
make seed
mutx tui`,
      },
    ],
  },
  api: {
    label: 'API-first',
    intro: '# Start with the contract. The current control-plane route truth lives under /v1/*.',
    environment: '/v1',
    mode: 'Control plane',
    footer:
      'Use docs.mutx.dev or localhost:8000/docs as the route reference. After login, mutx and mutx tui reuse the same stored session instead of inventing a second auth model.',
    blocks: [
      {
        id: 'health-register',
        label: 'Health + register',
        hint: 'Prove the API is up, then create the first operator account over /v1/auth/register.',
        script: `curl http://localhost:8000/health
curl -X POST http://localhost:8000/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","name":"You","password":"StrongPass1!"}'`,
      },
      {
        id: 'login-operate',
        label: 'Login + operate',
        hint: 'Store the CLI session and switch into the TUI using the same local config.',
        script: `curl -X POST http://localhost:8000/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"StrongPass1!"}'
mutx login --email you@example.com
mutx tui`,
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
    <div className="site-quickstart-card">
      <div className="site-quickstart-card-head">
        <div>
          <div className="site-step-index">{block.label}</div>
          <p className="site-quickstart-hint">{block.hint}</p>
        </div>
        <button
          type="button"
          onClick={() => onCopy(block)}
          className="site-quickstart-copy"
          aria-label={copied ? `${block.label} copied` : `Copy ${block.label} commands`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="site-quickstart-snippet">
        <span className="site-quickstart-prompt">$</span>
        <pre>{block.script}</pre>
      </div>
    </div>
  )
}

export function QuickstartTabs() {
  const [activeTab, setActiveTab] = useState<QuickstartTab>('one-liner')
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
    <div className="site-quickstart-shell">
      <div className="site-quickstart-toolbar">
        <div className="site-quickstart-toolbar-main">
          <div className="site-quickstart-dots" aria-hidden="true">
            <span className="site-quickstart-dot site-quickstart-dot-red" />
            <span className="site-quickstart-dot site-quickstart-dot-amber" />
            <span className="site-quickstart-dot site-quickstart-dot-green" />
          </div>

          <div className="site-quickstart-tabrail" role="tablist" aria-label="MUTX quickstart modes">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                data-active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className="site-quickstart-tab"
              >
                {tabContent[tab].label}
              </button>
            ))}
          </div>
        </div>

        <div className="site-quickstart-context" aria-label="Quickstart context">
          <span className="site-quickstart-context-pill site-quickstart-context-pill-active">
            {active.environment}
          </span>
          <span className="site-quickstart-context-pill">{active.mode}</span>
        </div>
      </div>

      <div className="site-quickstart-body">
        <p className="site-quickstart-comment">{active.intro}</p>

        <div className="grid gap-4 md:grid-cols-2">
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

      <p className="site-quickstart-footer">{active.footer}</p>
    </div>
  )
}
