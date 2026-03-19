# MUTX Dashboard Redesign Specification

## Overview
MUTX Dashboard - premium dark-first, operator-grade control plane for managing AI agents with explicit lifecycle, governance, and deployment semantics.

---

## Route Map (Agent-Native Control Plane)

| Path | Component | Agent-Native Label |
|------|-----------|-------------------|
| `/dashboard` | OverviewPage | Overview |
| `/dashboard/agents` | AgentsListPage | Agent Registry |
| `/dashboard/agents/[id]` | AgentDetailPage | Agent Inspector |
| `/dashboard/runs` | RunsListPage | Run History |
| `/dashboard/runs/[id]` | RunDetailPage | Run Inspector |
| `/dashboard/traces` | TracesListPage | Trace Explorer |
| `/dashboard/traces/[id]` | TraceDetailPage | Trace Analysis |
| `/dashboard/memory` | MemoryPage | Memory Atlas |
| `/dashboard/budgets` | BudgetsPage | Resource Budgets |
| `/dashboard/spawn` | SpawnPage | Agent Spawn |
| `/dashboard/webhooks` | WebhooksPage | Webhook Gateway |
| `/dashboard/api-keys` | APIKeysPage | Key Management |
| `/dashboard/monitoring` | MonitoringPage | System Health |

### Product Semantics
- agents are first-class resources
- deployments remain deployments, not borrowed platform metaphors
- runs and traces expose execution history and observability
- memory, budgets, and orchestration stay truthful to real MUTX product scope

---

## Design Token System

### Color Palette (Premium Dark-First)

```css
/* Core Backgrounds - Deep Space */
--bg-void: #030307;        /* Deepest background */
--bg-surface: #0a0a0e;      /* Card surfaces */
--bg-elevated: #12121a;     /* Elevated components */
--bg-hover: #1a1a24;        /* Hover states */

/* Borders - Subtle Edge */
--border-subtle: rgba(255, 255, 255, 0.06);
--border-default: rgba(255, 255, 255, 0.1);
--border-accent: rgba(255, 255, 255, 0.15);

/* Text - High Contrast */
--text-primary: #ffffff;
--text-secondary: rgba(255, 255, 255, 0.7);
--text-muted: rgba(255, 255, 255, 0.4);
--text-disabled: rgba(255, 255, 255, 0.2);

/* Accent Colors - Neon Accents */
--accent-cyan: #22d3ee;       /* Primary actions */
--accent-cyan-dim: rgba(34, 211, 238, 0.15);
--accent-emerald: #34d399;   /* Success states */
--accent-amber: #fbbf24;      /* Warnings */
--accent-rose: #fb7185;       /* Errors/critical */
--accent-violet: #a78bfa;     /* Special/highlight */

/* Glow Effects */
--glow-cyan: 0 0 20px rgba(34, 211, 238, 0.3);
--glow-emerald: 0 0 20px rgba(52, 211, 153, 0.3);
```

### Typography

```css
/* Font Family */
--font-display: 'Geist', system-ui, sans-serif;
--font-mono: 'Geist Mono', 'SF Mono', monospace;

/* Font Sizes */
--text-xs: 0.75rem;     /* 12px - Labels */
--text-sm: 0.875rem;    /* 14px - Secondary */
--text-base: 1rem;      /* 16px - Body */
--text-lg: 1.125rem;   /* 18px - Headings */
--text-xl: 1.25rem;    /* 20px - H3 */
--text-2xl: 1.5rem;    /* 24px - H2 */
--text-3xl: 1.875rem;  /* 30px - H1 */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Letter Spacing */
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
```

### Spacing System

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
```

### Border Radius

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

### Animation

```css
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
```

---

## App Shell Structure

### Layout
- Fixed left sidebar (280px) with navigation
- Main content area with top bar
- Responsive: sidebar collapses to icon rail on tablet, bottom nav on mobile

### Navigation Structure
```
MUTX
├── Overview (/)
├── Agents (/agents)
│   ├── Agent Registry
│   └── Agent Detail
├── Runs (/runs)
│   ├── Run History
│   └── Run Detail
├── Traces (/traces)
│   ├── Trace Explorer
│   └── Trace Detail
├── Memory (/memory)
├── Budgets (/budgets)
├── Spawn (/spawn)
├── Webhooks (/webhooks)
├── API Keys (/api-keys)
└── Monitoring (/monitoring)
```

### Visual Elements
- Sidebar: Dark glass with subtle border, logo at top
- Nav Items: Icon + label, active state with cyan accent bar
- Status indicators: Pulsing dots for live status
- Breadcrumbs: For nested routes

---

## Component Patterns

### Cards (Panel)
- Background: var(--bg-surface)
- Border: 1px solid var(--border-subtle)
- Border-radius: var(--radius-lg)
- Padding: var(--space-6)
- Hover: Border brightens to var(--border-default)

### Buttons
- Primary: Cyan fill, dark text
- Secondary: Transparent with border
- Ghost: No border, subtle hover
- Sizes: sm (32px), md (40px), lg (48px)

### Status Badges
- Running: Emerald with pulse
- Idle: Gray
- Error: Rose
- Warning: Amber

### Data Tables
- Header: Uppercase, muted text, var(--text-xs)
- Rows: Hover highlight
- Sortable columns with indicator
- Pagination controls

### Terminal/Trace View
- Monospace font
- Line numbers
- Syntax highlighting for JSON/logs
- Copy button

---

## Implementation Priority

1. **Phase 1**: Design tokens + globals.css
2. **Phase 2**: App shell with sidebar navigation
3. **Phase 3**: Overview page (Overview)
4. **Phase 4**: Agents list + detail
5. **Phase 5**: Supporting pages (runs, traces, memory, budgets)

---

## Success Criteria

- [ ] Premium dark aesthetic with high contrast
- [ ] Agent-native terminology throughout
- [ ] Responsive navigation (desktop → tablet → mobile)
- [ ] Consistent design tokens applied
- [ ] Smooth animations and transitions
- [ ] Clear visual hierarchy
- [ ] Operator-grade information density