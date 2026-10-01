import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ErrorBoundary } from '../../components/app/ErrorBoundary'
import { ControlErrorFallback } from '../../components/dashboard/demo/ControlErrorFallback'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => createElement('a', { href }, children),
}))

describe('demo client error recovery', () => {
  it('uses the safe demo fallback and resets the caught client error on retry', () => {
    const boundary = new ErrorBoundary({
      children: createElement('p', {}, 'Demo content'),
      fallback: reset => createElement(ControlErrorFallback, { reset }),
    })
    boundary.state = ErrorBoundary.getDerivedStateFromError(new Error('private-provider-token=do-not-display'))
    const fallback = boundary.render() as ReactElement<{ reset: () => void }>
    const html = renderToStaticMarkup(fallback)
    expect(html).toContain('We couldn’t open the demo.')
    expect(html).toContain('data-boundary-surface="control"')
    expect(html).not.toContain('private-provider-token')
    const setState = jest.spyOn(boundary, 'setState').mockImplementation(() => undefined)
    fallback.props.reset()
    expect(setState).toHaveBeenCalledWith({ hasError: false, error: undefined })
  })
})
