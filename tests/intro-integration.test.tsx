import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ParticleField } from '../src/features/particles/ParticleField'
import { renderIntro, renderParticles } from '../src/features/particles/renderer'
import { MUSE_START_ID, type MuseFormation } from '../src/features/muse/geometry'

vi.mock('../src/features/particles/renderer', async importOriginal => ({
  ...await importOriginal<object>(),
  createNameParticles: (_lines: string[], _rectangle: DOMRect, id: number) => [
    { id, x: 100, y: 100, target: { x: 100, y: 100 }, vx: 0, vy: 0, radius: 1, opacity: 1, phase: 0, frozen: false },
  ],
  renderParticles: vi.fn(),
  renderIntro: vi.fn(),
}))

let frames: Map<number, FrameRequestCallback>
let time: number
function advance(count: number) {
  for (let index = 0; index < count; index++) {
    time += 1000 / 60
    const pending = [...frames.values()]
    frames.clear()
    act(() => pending.forEach(callback => callback(time)))
  }
}
function mount(onIntroActiveChange = vi.fn()) {
  const result = render(<StrictMode><div className="portfolio-app" data-particle-surface><div data-particle-name /><ParticleField playIntro onIntroActiveChange={onIntroActiveChange} /></div></StrictMode>)
  return { ...result, canvas: result.container.querySelector('canvas')!, onIntroActiveChange }
}

beforeEach(() => {
  vi.mocked(renderIntro).mockReset()
  frames = new Map(); time = 0
  let id = 0
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { frames.set(++id, callback); return id }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn((frame: number) => { frames.delete(frame) }))
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ setTransform: vi.fn() } as unknown as CanvasRenderingContext2D)
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('connected particle intro', () => {
  it('runs approach, collision, and normal physics on the same field under StrictMode', () => {
    const { canvas, onIntroActiveChange, unmount } = mount()
    expect(screen.getByRole('button', { name: 'Skip intro' })).toBeTruthy()
    expect(canvas.dataset.introPhase).toBe('approach')
    const field = vi.mocked(renderIntro).mock.calls.at(-1)![1].particles
    const refs = [...field]
    advance(130)
    expect(canvas.dataset.introPhase).toBe('burst')
    expect(vi.mocked(renderIntro).mock.calls.at(-1)![1].particles).toBe(field)
    field.forEach((particle, index) => expect(particle).toBe(refs[index]))
    advance(220)
    expect(screen.queryByRole('button', { name: 'Skip intro' })).toBeNull()
    expect(onIntroActiveChange).toHaveBeenLastCalledWith(false)
    expect(vi.mocked(renderParticles).mock.calls.at(-1)![1]).toBe(field)
    expect(frames.size).toBe(1)
    unmount()
    expect(frames.size).toBe(0)
  })

  it('supports Skip and Replay without replacing particle objects', () => {
    const { canvas, onIntroActiveChange } = mount()
    const field = vi.mocked(renderIntro).mock.calls.at(-1)![1].particles
    fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }))
    expect(onIntroActiveChange).toHaveBeenLastCalledWith(false)
    expect(vi.mocked(renderParticles).mock.calls.at(-1)![1]).toBe(field)
    fireEvent.click(screen.getByRole('button', { name: 'Replay intro' }))
    advance(2)
    expect(canvas.dataset.introPhase).toBe('approach')
    expect(onIntroActiveChange).toHaveBeenLastCalledWith(true)
    expect(vi.mocked(renderIntro).mock.calls.at(-1)![1].particles).toBe(field)
    fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }))
    expect(onIntroActiveChange).toHaveBeenLastCalledWith(false)
  })

  it('bypasses the intro for reduced motion and disables Replay', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    const { onIntroActiveChange } = mount()
    expect(screen.queryByRole('button', { name: 'Skip intro' })).toBeNull()
    expect(onIntroActiveChange).toHaveBeenLastCalledWith(false)
    expect((screen.getByRole('button', { name: 'Replay intro' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('keeps name freeze and release working after the intro handoff', () => {
    const { container } = mount()
    fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }))
    const field = vi.mocked(renderParticles).mock.calls.at(-1)![1]
    const name = field.find(particle => particle.target)!
    const surface = container.querySelector('[data-particle-surface]')!
    for (const type of ['pointerdown', 'pointerup']) {
      const event = new MouseEvent(type, { bubbles: true, clientX: name.x, clientY: name.y, button: 0 })
      Object.defineProperties(event, { pointerType: { value: 'mouse' }, pointerId: { value: 1 } })
      act(() => { surface.dispatchEvent(event) })
    }
    expect(name.frozen).toBe(true)
    fireEvent.doubleClick(surface, { clientX: name.x, clientY: name.y })
    expect(name.frozen).toBe(false)
  })

  it('unlocks content and exposes the static-name fallback when canvas is unavailable', () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null)
    const { container, canvas, onIntroActiveChange, unmount } = mount()
    expect(onIntroActiveChange).toHaveBeenLastCalledWith(false)
    expect(screen.queryByRole('button', { name: 'Skip intro' })).toBeNull()
    expect(canvas.hidden).toBe(true)
    const app = container.querySelector('.portfolio-app')!
    expect(app.classList.contains('has-static-name')).toBe(true)
    expect((container.querySelector('.particle-controls') as HTMLElement).hidden).toBe(true)
    unmount()
    expect(app.classList.contains('has-static-name')).toBe(false)
  })

  it('hands the exact collision-born Muse objects to SVG before unlocking content and removes them from ordinary physics', () => {
    const order: string[] = []
    const onIntroActiveChange = vi.fn((active: boolean) => { if (!active) order.push('complete') })
    const onMuseFormed = vi.fn<(formation: MuseFormation) => void>(() => { order.push('formed') })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(1400, 500, 88, 102))
    const { container } = render(<div className="portfolio-app"><div data-particle-name /><div data-muse-anchor /><ParticleField playIntro onIntroActiveChange={onIntroActiveChange} onMuseFormed={onMuseFormed} /></div>)
    const initial = vi.mocked(renderIntro).mock.calls.at(-1)![1]
    const muse = initial.particles.filter(particle => particle.id >= MUSE_START_ID)
    expect(muse.length).toBeGreaterThan(20)
    let birth: { x: number; y: number }[] | undefined
    vi.mocked(renderIntro).mockImplementation((_context, intro) => {
      if (intro.born && !birth) birth = muse.map(({ x, y }) => ({ x, y }))
    })
    advance(350)
    expect(birth).toBeDefined()
    birth!.forEach(point => expect(point).toEqual(initial.origin))
    const formation = onMuseFormed.mock.calls.at(-1)![0]
    formation.particles.forEach((particle, index) => expect(particle).toBe(muse[index]))
    expect(order.slice(-2)).toEqual(['formed', 'complete'])
    expect(vi.mocked(renderParticles).mock.calls.at(-1)![1].every(particle => particle.id < MUSE_START_ID)).toBe(true)
    expect(container.querySelector('canvas')?.dataset.introPhase).toBe('complete')
  })
})
