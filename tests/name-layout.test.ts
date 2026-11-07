import { describe, expect, it } from 'vitest'
import { homeNameRectangle } from '../src/features/particles/renderer'

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
