import { describe, expect, it, vi } from 'vitest'
import { homeNameRectangle, renderIntro } from '../src/features/particles/renderer'
import { portfolio } from '../src/content/portfolio'
import { createIntro, INTRO_TIMING, stepIntro } from '../src/features/particles/intro'

it('keeps Chandra Vamshi together above Katineni', () => {
  expect(portfolio.nameLines).toEqual(['CHANDRA VAMSHI', 'KATINENI'])
})

it('leaves the portfolio background visible throughout the intro', () => {
  const fillRect = vi.fn()
  const context = { clearRect: vi.fn(), fillRect, save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), stroke: vi.fn() } as unknown as CanvasRenderingContext2D
  const intro = createIntro([], 1200, 750)
  renderIntro(context, intro)
  stepIntro(intro, INTRO_TIMING.collision)
  renderIntro(context, intro)
  expect(fillRect).not.toHaveBeenCalled()
})

describe('home name coordinates after resizing away from Home', () => {
  it('removes horizontal track translation from name targets', () => {
    const visibleRect = new DOMRect(-2200, 180, 600, 240)
    const home = homeNameRectangle(visibleRect, 1500, true, -2400)
    expect(home.left).toBe(200)
    expect(home.top).toBe(180)
    expect(home.width).toBe(600)
    expect(home.height).toBe(240)
  })

  it('restores vertical document coordinates after scrolling past Home', () => {
    const visibleRect = new DOMRect(24, -1320, 320, 190)
    const home = homeNameRectangle(visibleRect, 1500, false)
    expect(home.left).toBe(24)
    expect(home.top).toBe(180)
    expect(home.width).toBe(320)
  })
})
