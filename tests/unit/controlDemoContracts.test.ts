import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function readSource(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

describe('control demo interaction contracts', () => {
  const appSource = readSource('components/dashboard/demo/MutxDemoApp.tsx')
  const primitivesSource = readSource('components/dashboard/demo/demoPrimitives.tsx')
  const contentSource = readSource('components/dashboard/demo/demoContent.ts')
  const sectionsSource = readSource('components/dashboard/demo/routeSections.tsx')
  const styleSource = readSource('components/dashboard/demo/controlDemo.module.css')
  const boundarySource = [
    readSource('app/control/loading.tsx'),
    readSource('app/control/error.tsx'),
    readSource('app/control/not-found.tsx'),
  ].join('\n')
  const demoVisualSource = [appSource, primitivesSource, contentSource, sectionsSource, styleSource].join('\n')
  const visualSource = [demoVisualSource, boundarySource].join('\n')

  it('uses the shared charcoal, paper, and lime visual grammar', () => {
    expect(appSource).toContain('data-control-visual-system="operator-workspace"')
    expect(styleSource).toContain('--night: #0b0e0f')
    expect(styleSource).toContain('--paper: #f0efe9')
    expect(styleSource).toContain('--accent: #d7ee83')
    expect(demoVisualSource).not.toContain('#ff571c')
    expect(demoVisualSource).not.toMatch(/cyan-/)
    expect(demoVisualSource).not.toMatch(/rounded-\[(?:9|1\d|2\d)px\]/)
    expect(demoVisualSource).not.toMatch(/text-\[(?:8|9|10)px\]/)
    expect(demoVisualSource).not.toContain('group-hover:translate')
  })

  it('keeps sample data clear and the interface free from simulated telemetry', () => {
    expect(appSource).toContain('data-no-live-writes="true"')
    expect(appSource).toContain('Demo · sample data · changes stay in this tab')
    expect(appSource.match(/Demo · sample data · changes stay in this tab/g)).toHaveLength(1)
    expect(appSource).not.toContain('setInterval')
    expect(appSource).not.toContain('data-demo-tick')
    expect(appSource).not.toContain('rotate(BASE_SIGNALS')
    expect(styleSource).toContain('@media (prefers-reduced-motion: reduce)')
    expect(visualSource).not.toMatch(/(?:^|[\s"'`])animate-(?:pulse|spin|bounce)/m)
    expect(boundarySource).toContain('motion-reduce:animate-none')
  })

  it('keeps presenter notes behind an accessible, focus-managed dialog', () => {
    expect(appSource).toContain('const [presenterOpen, setPresenterOpen] = useState(false)')
    expect(appSource).toContain('role="dialog"')
    expect(appSource).toContain('aria-modal="true"')
    expect(appSource).toContain('aria-expanded={presenterOpen}')
    expect(appSource).toContain('setAttribute("inert", "")')
    expect(appSource).toContain('event.key === "Escape"')
    expect(appSource).toContain('presenterTriggerRef.current)?.focus')
    expect(appSource).toContain('presenterOpen ? (')
    expect(appSource).toContain('>Presenter notes</h2>')
  })

  it('keeps search, local previews, and settings keyboard operable', () => {
    expect(appSource).toContain('aria-label="Open settings"')
    expect(primitivesSource).toContain('aria-label="Search demo pages"')
    expect(primitivesSource).toContain('event.key === "Escape"')
    expect(primitivesSource).toContain('href={item.href}')
    expect(primitivesSource).toContain('onClick={() => setSelected(true)}')
    expect(primitivesSource).toContain('Preview selected: ${action.label}.')
    expect(sectionsSource).not.toContain('<button')
    expect(primitivesSource).toContain('export function DecisionExampleActions(')
    expect(primitivesSource).toContain('onClick={onApprove}')
    expect(primitivesSource).toContain('onClick={onDecline}')
    expect(primitivesSource).toContain('onClick={onReset}')
    const stateSource = readSource('components/dashboard/demo/ControlDemoState.tsx')
    expect([sectionsSource, primitivesSource, stateSource].join('\n')).not.toMatch(/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|useMutation)\b/)
  })
})
