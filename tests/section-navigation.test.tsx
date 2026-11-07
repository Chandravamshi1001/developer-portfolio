import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSectionNavigation } from '../src/features/navigation/useSectionNavigation'
import { portfolio } from '../src/content/portfolio'

interface TriggerOptions {
  pin: boolean
  scrub: boolean | number
  invalidateOnRefresh: boolean
  end: () => string
  onUpdate?: (trigger: Trigger) => void
  onRefreshInit?: (trigger: Trigger) => void
  onRefresh?: (trigger: Trigger) => void
}
interface Trigger { start: number; end: number; progress: number; vars: TriggerOptions; kill: () => void; refresh: () => void }
interface TweenOptions { x: () => number; ease: string; scrollTrigger: TriggerOptions }

// jsdom has no layout or scrolling. Mock only the public animation boundary;
// actual pinning and text layout require the separate browser checks.
const animation = vi.hoisted(() => ({
  options: undefined as TweenOptions | undefined, trigger: undefined as Trigger | undefined,
  to: vi.fn(), revert: vi.fn(), refresh: vi.fn(), update: vi.fn(), registerPlugin: vi.fn(),
}))
vi.mock('gsap', () => ({ gsap: {
  registerPlugin: animation.registerPlugin, to: animation.to,
  context: (callback: () => void) => { callback(); return { revert: animation.revert } },
} }))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { refresh: animation.refresh, update: animation.update } }))

function Harness() {
  const { shellRef, trackRef, horizontal, active, navigate } = useSectionNavigation()
  return <><button onClick={() => navigate('projects')}>Go projects</button><output data-testid="mode">{horizontal ? 'horizontal' : 'vertical'}</output><output data-testid="active">{active}</output><main ref={shellRef} className={horizontal ? 'section-shell is-horizontal' : 'section-shell'}><div className="section-viewport"><div ref={trackRef} className="section-track">{portfolio.sections.map(({ id }) => <section key={id} id={id} className="portfolio-section" tabIndex={-1}><div className="section-content"><h2>{id}</h2><div className="section-scroll">{id}<a href={`#${id}`}>{id} link</a></div></div></section>)}</div></div></main></>
}

let finePointer = true, reducedMotion = false, viewportWidth = 1200, trackWidth = 9200
const offsets: Record<string, number> = { home: 0, about: 1200, experience: 2400, projects: 4400, skills: 5600, education: 6800, contact: 8000 }
let nextFrame = 0
let frames: Map<number, FrameRequestCallback>
let resizeContent: () => void
const baseOffsets = { ...offsets }
function flushFrames() {
  act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(16)) })
}

beforeEach(() => {
  finePointer = true; reducedMotion = false; viewportWidth = 1200; trackWidth = 9200; frames = new Map()
  Object.assign(offsets, baseOffsets)
  animation.options = undefined; animation.trigger = undefined
  history.replaceState(null, '', '/')
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 750 })
  Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => viewportWidth })
  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 })
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) { return this.classList.contains('section-track') ? trackWidth : viewportWidth })
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => viewportWidth)
  vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (this: HTMLElement) { return offsets[this.id] ?? 0 })
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockReturnValue(80)
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(300)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(750)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const translated = Math.max(0, window.scrollY - 80)
    const left = this.tagName === 'A' ? (offsets[this.closest('section')?.id ?? 'home'] + 144 - translated) : this.classList.contains('section-track') ? -translated : 0
    return { left, right: left + 40, top: 0, bottom: 40, x: left, y: 0, width: 40, height: 40, toJSON: () => ({}) }
  })
  vi.spyOn(window, 'scrollTo').mockImplementation((options: ScrollToOptions | number) => { if (typeof options === 'object') window.scrollY = options.top ?? window.scrollY })
  HTMLElement.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal('ResizeObserver', class { constructor(callback: () => void) { resizeContent = callback } observe() {} disconnect() {} })
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)))
  vi.stubGlobal('matchMedia', vi.fn((query: string) => {
    const minimumWidth = Number(query.match(/min-width:\s*(\d+)px/)?.[1] ?? 0)
    const minimumHeight = Number(query.match(/min-height:\s*(\d+)px/)?.[1] ?? 0)
    const matches = query.includes('prefers-reduced-motion') ? reducedMotion : viewportWidth >= minimumWidth && window.innerHeight >= minimumHeight && finePointer
    return { matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }
  }))
  animation.to.mockImplementation((_target: Element, options: TweenOptions) => {
    animation.options = options
    const trigger: Trigger = { start: 80, end: 80 + Number(options.scrollTrigger.end().slice(2)), progress: 0, vars: options.scrollTrigger, kill: vi.fn(), refresh: animation.refresh }
    animation.trigger = trigger
    return { scrollTrigger: trigger, kill: vi.fn() }
  })
  animation.refresh.mockImplementation(() => {
    const trigger = animation.trigger
    if (!trigger) return
    trigger.vars.onRefreshInit?.(trigger)
    trigger.end = trigger.start + Number(trigger.vars.end().slice(2))
    trigger.vars.onRefresh?.(trigger)
  })
  animation.update.mockImplementation(() => {
    const trigger = animation.trigger
    if (!trigger) return
    trigger.progress = Math.max(0, Math.min(1, (window.scrollY - trigger.start) / (trigger.end - trigger.start)))
    trigger.vars.onUpdate?.(trigger)
  })
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); history.replaceState(null, '', '/') })

describe('horizontal section navigation', () => {
  it('pins one scrubbed track using actual width and recalculates travel dynamically', () => {
    render(<Harness />)
    expect(screen.getByTestId('mode').textContent).toBe('horizontal')
    expect(animation.to).toHaveBeenCalledTimes(1)
    expect(animation.options?.ease).toBe('none')
    expect(animation.options?.scrollTrigger.pin).toBe(true)
    expect(animation.options?.scrollTrigger.scrub).toBeTruthy()
    expect(animation.options?.scrollTrigger.invalidateOnRefresh).toBe(true)
    expect(animation.options?.x()).toBe(-8000)
    expect(animation.options?.scrollTrigger.end()).toBe('+=8000')
    trackWidth = 10400; viewportWidth = 1400
    expect(animation.options?.x()).toBe(-9000)
    expect(animation.options?.scrollTrigger.end()).toBe('+=9000')
  })
  it('uses the measured Projects offset with no preceding focus scroll', () => {
    render(<Harness />); flushFrames(); vi.mocked(window.scrollTo).mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Go projects' }))
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 4480, behavior: 'smooth' })
    expect(document.activeElement?.id).toBe('projects')
    expect(location.hash).toBe('#projects')
  })
  it('does not add duplicate history entries for the same section', () => {
    render(<Harness />)
    const push = vi.spyOn(history, 'pushState')
    fireEvent.click(screen.getByRole('button', { name: 'Go projects' }))
    fireEvent.click(screen.getByRole('button', { name: 'Go projects' }))
    expect(push).toHaveBeenCalledTimes(1)
  })
  it('reveals offscreen keyboard focus at its horizontal position', () => {
    render(<Harness />); flushFrames(); vi.mocked(window.scrollTo).mockClear()
    act(() => { screen.getByRole('link', { name: 'contact link' }).focus() })
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 8080, behavior: 'instant' })
  })
  it.each(['home', 'projects', 'contact'])('restores a direct #%s anchor after pin creation', id => {
    history.replaceState(null, '', `/#${id}`)
    render(<Harness />); flushFrames()
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 80 + offsets[id], behavior: 'instant' })
  })
  it('handles popstate independently of hashchange and restores an empty hash to Home', () => {
    render(<Harness />)
    history.replaceState(null, '', '/#projects'); fireEvent.popState(window); flushFrames()
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 4480, behavior: 'instant' })
    history.replaceState(null, '', '/'); fireEvent.popState(window); flushFrames()
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 80, behavior: 'instant' })
  })
  it.each(['/', '/#home'])('restores manual Experience scrolling on Back from Projects when the previous URL was %s', previousUrl => {
    history.replaceState({ external: 'preserved' }, '', previousUrl)
    render(<Harness />); flushFrames()
    // The hash remains empty or stale while normal scroll reaches partway
    // through Experience; Back must restore that position, not the hash's Home.
    window.scrollY = 2780
    act(() => { animation.update() })
    expect(screen.getByTestId('active').textContent).toBe('experience')
    const replace = vi.spyOn(history, 'replaceState')
    fireEvent.click(screen.getByRole('button', { name: 'Go projects' }))
    const previousState = replace.mock.calls[0]?.[0]
    expect(previousState).toMatchObject({ external: 'preserved' })
    expect(location.hash).toBe('#projects')
    history.replaceState(previousState, '', previousUrl)
    fireEvent(window, new PopStateEvent('popstate', { state: previousState }))
    // Real browser traversal may also emit hashchange after popstate.
    fireEvent(window, new HashChangeEvent('hashchange'))
    flushFrames()
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 2780, behavior: 'instant' })
    expect(screen.getByTestId('active').textContent).toBe('experience')
  })
  it('restores manual Skills scrolling on Forward rather than replaying its stale Projects hash', () => {
    history.replaceState({ external: 'preserved' }, '', '/')
    render(<Harness />); flushFrames()
    window.scrollY = 2780
    act(() => { animation.update() })
    fireEvent.scroll(window); fireEvent(window, new Event('scrollend')); flushFrames()
    const previousState = history.state
    fireEvent.click(screen.getByRole('button', { name: 'Go projects' }))
    window.scrollY = 5980
    act(() => { animation.update() })
    fireEvent.scroll(window); fireEvent(window, new Event('scrollend')); flushFrames()
    const forwardState = history.state
    expect(location.hash).toBe('#projects')
    expect(screen.getByTestId('active').textContent).toBe('skills')
    // Model Back and Forward using the states retained by those browser entries.
    history.replaceState(previousState, '', '/')
    fireEvent(window, new PopStateEvent('popstate', { state: previousState }))
    fireEvent(window, new HashChangeEvent('hashchange')); flushFrames()
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 2780, behavior: 'instant' })
    history.replaceState(forwardState, '', '/#projects')
    fireEvent(window, new PopStateEvent('popstate', { state: forwardState }))
    fireEvent(window, new HashChangeEvent('hashchange')); flushFrames()
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 5980, behavior: 'instant' })
    expect(screen.getByTestId('active').textContent).toBe('skills')
  })
  it('handles external hashes without adding history entries', () => {
    render(<Harness />)
    const push = vi.spyOn(history, 'pushState')
    history.replaceState(null, '', '/#about'); fireEvent(window, new HashChangeEvent('hashchange')); flushFrames()
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 1280, behavior: 'instant' })
    expect(push).not.toHaveBeenCalled()
  })
  it('resolves unknown hashes safely to Home', () => {
    render(<Harness />); flushFrames(); vi.mocked(window.scrollTo).mockClear()
    history.replaceState(null, '', '/#missing'); fireEvent(window, new HashChangeEvent('hashchange')); flushFrames()
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 80, behavior: 'instant' })
  })
  it('preserves the visible section through refresh rather than replaying a stale Home hash', () => {
    history.replaceState(null, '', '/#home')
    render(<Harness />); flushFrames()
    window.scrollY = 4480
    act(() => { animation.update() })
    expect(screen.getByTestId('active').textContent).toBe('projects')
    // Wider preceding content changes Projects' actual position on the track.
    offsets.projects = 5000; offsets.skills = 6200; offsets.education = 7400; offsets.contact = 8600; trackWidth = 9800
    act(() => { animation.refresh() })
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 5080, behavior: 'instant' })
    expect(location.hash).toBe('#home')
    expect(screen.getByTestId('active').textContent).toBe('projects')
  })
  it('refreshes measured travel after content resizing or details toggling', () => {
    const { container } = render(<Harness />); flushFrames()
    animation.refresh.mockClear()
    act(() => { resizeContent() }); flushFrames()
    expect(animation.refresh).toHaveBeenCalledTimes(1)
    animation.refresh.mockClear()
    fireEvent(container.querySelector('.section-track')!, new Event('toggle', { bubbles: false }))
    flushFrames()
    expect(animation.refresh).toHaveBeenCalledTimes(1)
  })
  it.each(['mobile', 'short viewport', 'coarse pointer', 'reduced motion'])('uses vertical flow for %s', fallback => {
    if (fallback === 'mobile') viewportWidth = 390
    if (fallback === 'short viewport') Object.defineProperty(window, 'innerHeight', { configurable: true, value: 450 })
    if (fallback === 'coarse pointer') finePointer = false
    if (fallback === 'reduced motion') reducedMotion = true
    render(<Harness />)
    expect(screen.getByTestId('mode').textContent).toBe('vertical')
    expect(animation.to).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Go projects' }))
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' })
  })
  it('cleans up animation and navigation listeners through StrictMode and unmount', () => {
    const { unmount } = render(<StrictMode><Harness /></StrictMode>)
    expect(animation.to).toHaveBeenCalledTimes(2)
    expect(animation.revert).toHaveBeenCalledTimes(1)
    unmount()
    expect(animation.revert).toHaveBeenCalledTimes(2)
    vi.mocked(window.scrollTo).mockClear()
    history.replaceState(null, '', '/#projects'); fireEvent.popState(window); fireEvent(window, new HashChangeEvent('hashchange')); flushFrames()
    expect(window.scrollTo).not.toHaveBeenCalled()
  })
  it('reverts the desktop animation when reduced motion switches on', () => {
    const { rerender } = render(<Harness />)
    reducedMotion = true
    rerender(<Harness />)
    expect(screen.getByTestId('mode').textContent).toBe('vertical')
    expect(animation.revert).toHaveBeenCalledTimes(1)
    expect(animation.to).toHaveBeenCalledTimes(1)
  })
})
