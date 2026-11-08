import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PortfolioMuse } from '../src/components/PortfolioMuse'

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 })
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
const advance = (milliseconds: number) => act(() => { vi.advanceTimersByTime(milliseconds) })
const muse = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-muse-pose]')!
function scroll(top: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: top })
  fireEvent.scroll(window)
}

describe('particle Muse', () => {
  it('uses particles, waves on arrival, and settles into idle without duplicate StrictMode timers', () => {
    const { container, unmount } = render(<StrictMode><PortfolioMuse /></StrictMode>)
    expect(screen.getByRole('button', { name: 'Make Muse tumble' })).toBeTruthy()
    expect(muse(container).dataset.musePose).toBe('wave')
    expect(container.querySelectorAll('.muse-eyes circle')).toHaveLength(2)
    expect(container.querySelectorAll('.muse-look > .muse-eyes .muse-eye')).toHaveLength(2)
    expect(container.querySelectorAll('svg circle').length).toBeGreaterThan(20)
    expect(container.querySelectorAll('.muse-mouth circle').length).toBeGreaterThan(2)
    const poses = new Set([muse(container).dataset.musePose])
    for (let index = 0; index < 25; index++) {
      advance(200)
      poses.add(muse(container).dataset.musePose)
    }
    expect(poses.has('wave')).toBe(true)
    expect(muse(container).dataset.musePose).toBe('idle')
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('runs in the requested direction and restarts repeated navigation requests', () => {
    const { container, rerender } = render(<PortfolioMuse request={{ sequence: 1, direction: 1 }} />)
    expect(muse(container).dataset.musePose).toBe('run')
    expect(muse(container).dataset.museDirection).toBe('right')
    expect(muse(container).dataset.museExpression).toBe('run')
    expect(container.querySelectorAll('.muse-shed circle').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('.muse-shed circle').length).toBeLessThanOrEqual(24)
    advance(800)
    rerender(<PortfolioMuse request={{ sequence: 2, direction: 1 }} />)
    advance(500)
    expect(muse(container).dataset.musePose).toBe('run')
    advance(1000)
    expect(muse(container).dataset.musePose).toBe('idle')
    expect(muse(container).dataset.museExpression).toBe('smile')
    expect(container.querySelectorAll('.muse-shed circle')).toHaveLength(0)
    rerender(<PortfolioMuse request={{ sequence: 3, direction: -1 }} />)
    expect(muse(container).dataset.museDirection).toBe('left')
  })

  it('recovers from a tumble and cancels stale recovery when navigation interrupts it', () => {
    const { container, rerender } = render(<PortfolioMuse />)
    fireEvent.click(screen.getByRole('button', { name: 'Make Muse tumble' }))
    expect(muse(container).dataset.musePose).toBe('fall')
    advance(1500)
    fireEvent.click(screen.getByRole('button', { name: 'Make Muse tumble' }))
    advance(500)
    expect(muse(container).dataset.musePose).toBe('fall')
    rerender(<PortfolioMuse request={{ sequence: 1, direction: 1 }} />)
    advance(800)
    expect(muse(container).dataset.musePose).toBe('run')
    advance(1200)
    expect(muse(container).dataset.musePose).toBe('idle')
  })

  it('gives static feedback for reduced motion and cancels timers on unmount', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    const { container, unmount } = render(<PortfolioMuse request={{ sequence: 1, direction: -1 }} />)
    expect(muse(container).dataset.reducedMotion).toBe('true')
    expect(container.querySelectorAll('.muse-shed circle')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Make Muse tumble' }))
    expect(muse(container).dataset.musePose).toBe('fall')
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('runs continuously with actual scroll direction, retains its animation, and idles after scrolling stops', () => {
    const { container, unmount } = render(<PortfolioMuse />)
    advance(2500)
    scroll(100)
    expect(muse(container).dataset.musePose).toBe('run')
    expect(muse(container).dataset.museDirection).toBe('right')
    const animation = container.querySelector('.muse-travel')
    advance(100)
    scroll(200)
    expect(container.querySelector('.muse-travel')).toBe(animation)
    advance(100)
    expect(muse(container).dataset.musePose).toBe('run')
    scroll(150)
    expect(muse(container).dataset.museDirection).toBe('left')
    advance(200)
    expect(muse(container).dataset.musePose).toBe('idle')
    scroll(150)
    expect(muse(container).dataset.musePose).toBe('idle')
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
