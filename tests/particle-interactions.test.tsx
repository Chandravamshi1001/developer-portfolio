import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ParticleField } from '../src/features/particles/ParticleField'
import { renderParticles } from '../src/features/particles/renderer'
import { createAmbientParticles } from '../src/features/particles/physics'

vi.mock('../src/features/particles/renderer', async importOriginal => ({
  ...await importOriginal<object>(),
  createNameParticles: (_lines: string[], _rectangle: DOMRect, id: number) => [{ id, x: 100, y: 100, target: { x: 100, y: 100 }, vx: 0, vy: 0, radius: 1, opacity: 1, phase: 0, frozen: false }],
  renderParticles: vi.fn(),
}))
vi.mock('../src/features/particles/physics', async importOriginal => ({
  ...await importOriginal<object>(),
  createAmbientParticles: vi.fn(() => [{ id: 0, x: 50, y: 50, vx: 2, vy: 2, radius: 1, opacity: 1, phase: 0, frozen: false }]),
}))

function pointer(target: EventTarget, type: string, x: number, y: number, pointerType = 'mouse', pointerId = 1) {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 })
  Object.defineProperties(event, { pointerType: { value: pointerType }, pointerId: { value: pointerId } })
  act(() => { target.dispatchEvent(event) })
}
function mount() {
  render(<div data-particle-surface data-testid="surface"><div data-particle-name /><a href="#projects">Projects</a><ParticleField /></div>)
  return screen.getByTestId('surface')
}
function status() { return screen.getByRole('status').textContent }

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ setTransform: vi.fn() } as unknown as CanvasRenderingContext2D)
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('particle field controls and gestures', () => {
  it('freezes a clicked particle, keeps it frozen on another click, and releases on double click', () => {
    const surface = mount()
    pointer(surface, 'pointerdown', 50, 50); pointer(surface, 'pointerup', 50, 50)
    expect(status()).toContain('1 frozen')
    pointer(surface, 'pointerdown', 50, 50); pointer(surface, 'pointerup', 50, 50)
    expect(status()).toContain('1 frozen')
    fireEvent.doubleClick(surface, { clientX: 50, clientY: 50 })
    expect(status()).toContain('0 frozen')
  })

  it('freezes a dragged region and releases exactly its selected particles', () => {
    const surface = mount()
    pointer(surface, 'pointerdown', 110, 110); pointer(surface, 'pointermove', 40, 40); pointer(surface, 'pointerup', 40, 40)
    expect(status()).toContain('2 frozen')
    expect(status()).toContain('2 selected')
    fireEvent.click(screen.getByRole('button', { name: 'Release selection' }))
    expect(status()).toContain('0 frozen')
    expect(status()).toContain('0 selected')
  })

  it('cancels an unfinished region after pointer cancellation', () => {
    const surface = mount()
    pointer(surface, 'pointerdown', 40, 40); pointer(surface, 'pointermove', 110, 110)
    pointer(surface, 'pointercancel', 110, 110); pointer(surface, 'pointerup', 110, 110)
    expect(status()).toContain('0 frozen')
    expect(status()).toContain('0 selected')
  })

  it('cancels an unfinished particle drag when page scrolling navigates sections', () => {
    const surface = mount()
    pointer(surface, 'pointerdown', 40, 40); pointer(surface, 'pointermove', 110, 110)
    fireEvent.scroll(window)
    pointer(surface, 'pointerup', 110, 110)
    expect(status()).toContain('0 frozen')
    expect(status()).toContain('0 selected')
  })

  it('leaves navigation and controls untouched by particle selection', () => {
    mount()
    const link = screen.getByRole('link', { name: 'Projects' })
    pointer(link, 'pointerdown', 50, 50); pointer(link, 'pointerup', 50, 50)
    fireEvent.doubleClick(link, { clientX: 50, clientY: 50 })
    expect(status()).toContain('0 frozen')
    expect(link.getAttribute('href')).toBe('#projects')
  })

  it('toggles a particle on touch taps and supports explicit touch region selection', () => {
    const surface = mount()
    pointer(surface, 'pointerdown', 50, 50, 'touch'); pointer(surface, 'pointerup', 50, 50, 'touch')
    expect(status()).toContain('1 frozen')
    pointer(surface, 'pointerdown', 50, 50, 'touch'); pointer(surface, 'pointerup', 50, 50, 'touch')
    expect(status()).toContain('0 frozen')
    fireEvent.click(screen.getByRole('button', { name: 'Select region' }))
    pointer(surface, 'pointerdown', 40, 40, 'touch'); pointer(surface, 'pointermove', 110, 110, 'touch'); pointer(surface, 'pointerup', 110, 110, 'touch')
    expect(status()).toContain('2 selected')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel selection' }))
    expect(screen.queryByRole('button', { name: 'Cancel selection' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Release all' }))
    expect(status()).toContain('0 frozen')
  })

  it('preserves touch scrolling without freezing a particle at the swipe endpoint', () => {
    const surface = mount()
    pointer(surface, 'pointerdown', 50, 200, 'touch')
    pointer(surface, 'pointermove', 50, 50, 'touch')
    pointer(surface, 'pointerup', 50, 50, 'touch')
    expect(status()).toContain('0 frozen')
  })

  it('exposes pause/resume and reduced-motion status', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    mount()
    expect(status()).toContain('Reduced motion enabled')
    fireEvent.click(screen.getByRole('button', { name: 'Pause motion' }))
    expect(screen.getByRole('button', { name: 'Resume motion' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('preserves particle state when pause and selection controls change', () => {
    const surface = mount()
    const particles = vi.mocked(renderParticles).mock.calls.at(-1)?.[1]
    pointer(surface, 'pointerdown', 50, 50); pointer(surface, 'pointerup', 50, 50)
    fireEvent.click(screen.getByRole('button', { name: 'Pause motion' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select region' }))
    expect(vi.mocked(renderParticles).mock.calls.at(-1)?.[1]).toBe(particles)
    expect(status()).toContain('1 frozen')
  })

  it('redraws release controls immediately while reduced motion is active', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    const surface = mount()
    pointer(surface, 'pointerdown', 50, 50); pointer(surface, 'pointerup', 50, 50)
    const callsBefore = vi.mocked(renderParticles).mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: 'Release all' }))
    expect(vi.mocked(renderParticles).mock.calls.length).toBeGreaterThan(callsBefore)
    expect(status()).toContain('0 frozen')
  })

  it('keeps frozen name IDs separate when ambient population changes on resize', () => {
    const surface = mount()
    pointer(surface, 'pointerdown', 100, 100); pointer(surface, 'pointerup', 100, 100)
    const initial = vi.mocked(renderParticles).mock.calls.at(-1)?.[1] ?? []
    const frozenName = initial.find(particle => particle.target)
    expect(frozenName?.frozen).toBe(true)
    vi.mocked(createAmbientParticles).mockReturnValueOnce([
      { id: 0, x: 50, y: 50, vx: 2, vy: 2, radius: 1, opacity: 1, phase: 0, frozen: false },
      { id: 1, x: 60, y: 60, vx: 2, vy: 2, radius: 1, opacity: 1, phase: 0, frozen: false },
    ])
    fireEvent(window, new Event('resize'))
    const resized = vi.mocked(renderParticles).mock.calls.at(-1)?.[1] ?? []
    expect(resized.filter(particle => particle.target)).toEqual([frozenName])
    expect(new Set(resized.map(particle => particle.id)).size).toBe(resized.length)
    expect(resized.filter(particle => !particle.target)).toHaveLength(2)
  })
})
