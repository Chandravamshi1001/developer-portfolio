import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSectionNavigation } from '../src/features/navigation/useSectionNavigation'

vi.mock('../src/hooks/useMediaQuery', () => ({ useMediaQuery: (query: string) => !query.includes('reduced-motion') }))

function Harness() {
  const { shellRef, trackRef, horizontal, navigate } = useSectionNavigation()
  return <><button onClick={() => navigate('projects')}>Go projects</button><output data-testid="mode">{horizontal ? 'horizontal' : 'vertical'}</output><main ref={shellRef}><div ref={trackRef}>{['home', 'about', 'projects', 'skills', 'education', 'contact'].map(id => <section key={id} id={id} className="portfolio-section" tabIndex={-1} style={{ paddingTop: 130, paddingBottom: 130 }}><div className="section-content">{id}<a href={`#${id}`}>{id} link</a></div></section>)}</div></main></>
}

let contentHeight = 300
beforeEach(() => {
  contentHeight = 300
  history.replaceState(null, '', '/')
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 750 })
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 })
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) { return this.classList.contains('section-content') ? contentHeight : 750 })
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(750)
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  HTMLElement.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); history.replaceState(null, '', '/') })

describe('desktop section scroll behavior', () => {
  it('navigates smoothly without a preceding instant scroll caused by programmatic focus', () => {
    render(<Harness />)
    expect(screen.getByTestId('mode').textContent).toBe('horizontal')
    vi.mocked(window.scrollTo).mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Go projects' }))
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 1500, behavior: 'smooth' })
    expect(document.activeElement?.id).toBe('projects')
    expect(location.hash).toBe('#projects')
  })

  it('reveals a section when keyboard focus reaches its content', () => {
    render(<Harness />)
    vi.mocked(window.scrollTo).mockClear()
    act(() => { screen.getByRole('link', { name: 'contact link' }).focus() })
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 3750, behavior: 'instant' })
  })

  it('falls back to vertical content when real section padding leaves insufficient space', () => {
    contentHeight = 500
    render(<Harness />)
    expect(screen.getByTestId('mode').textContent).toBe('vertical')
  })
})
