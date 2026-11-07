import { describe, expect, it } from 'vitest'
import { containsPoint, nearestParticle, rectangleFromPoints } from '../src/features/particles/geometry'
import { DRAG_THRESHOLD, isDrag, isProtectedTarget } from '../src/features/particles/gestures'
import { createAmbientParticles, freezeParticle, freezeRegion, heartbeat, releaseAll, releaseParticle, releaseSelected, stepParticles, type Particle } from '../src/features/particles/physics'

function particle(id: number, x = 50, y = 50, overrides: Partial<Particle> = {}): Particle {
  return { id, x, y, vx: 10, vy: 5, radius: 1, opacity: 1, frozen: false, phase: 0, ...overrides }
}

describe('particle simulation', () => {
  it('keeps frozen name and ambient particles stationary through heartbeat, pointer force, and wrapping', () => {
    const name = particle(1, 50, 50, { target: { x: 100, y: 100 } })
    const ambient = particle(2, -20, -20)
    const moving = particle(3)
    freezeParticle(name)
    freezeParticle(ambient)
    const before = [structuredClone(name), structuredClone(ambient)]
    for (let frame = 0; frame < 120; frame++) stepParticles([name, ambient, moving], 1 / 60, frame / 60, 300, 300, { x: 49, y: 49 })
    expect([name, ambient]).toEqual(before)
    expect(moving.x).not.toBe(50)
  })

  it('resumes ambient motion and name assembly after release', () => {
    const ambient = particle(1, 50, 50, { frozen: true })
    const name = particle(2, 20, 20, { frozen: true, target: { x: 100, y: 100 } })
    releaseParticle(ambient)
    releaseParticle(name)
    stepParticles([ambient, name], 0.02, 2, 300, 300)
    expect(ambient.x).toBeCloseTo(50.2)
    expect(name.x).toBeGreaterThan(20)
    expect(name.y).toBeGreaterThan(20)
  })

  it('bounds frame deltas and ignores negative deltas', () => {
    const longFrame = particle(1)
    const cappedFrame = particle(2)
    stepParticles([longFrame], 10, 0, 300, 300)
    stepParticles([cappedFrame], 0.04, 0, 300, 300)
    expect(longFrame.x).toBe(cappedFrame.x)
    expect(longFrame.y).toBe(cappedFrame.y)
    stepParticles([longFrame], -1, 0, 300, 300)
    expect(longFrame.x).toBe(cappedFrame.x)
  })

  it('provides static name targets and ambient positions for reduced motion without moving frozen particles', () => {
    const ambient = particle(1)
    const name = particle(2, 10, 10, { target: { x: 80, y: 90 } })
    const frozen = particle(3, 15, 15, { frozen: true, target: { x: 80, y: 90 } })
    stepParticles([ambient, name, frozen], 0.04, 0.32, 300, 300, { x: 49, y: 49 }, true)
    expect([ambient.x, ambient.y]).toEqual([50, 50])
    expect([name.x, name.y]).toEqual([80, 90])
    expect([frozen.x, frozen.y]).toEqual([15, 15])
  })

  it('uses a periodic double pulse with a quiet interval', () => {
    expect(heartbeat(0.32)).toBeGreaterThan(heartbeat(1.8))
    expect(heartbeat(0.65)).toBeGreaterThan(heartbeat(1.8))
    expect(heartbeat(0.32 + 3.6)).toBeCloseTo(heartbeat(0.32))
  })

  it('caps ambient particle population and supports deterministic randomness', () => {
    expect(createAmbientParticles(100, 100, () => 0.5)).toHaveLength(25)
    expect(createAmbientParticles(10000, 10000, () => 0.5)).toHaveLength(110)
    expect(createAmbientParticles(800, 600, () => 0.5)).toEqual(createAmbientParticles(800, 600, () => 0.5))
  })
})

describe('region selection and hit testing', () => {
  it('normalizes rectangles dragged in any direction and includes boundary points', () => {
    const rect = rectangleFromPoints({ x: 30, y: 40 }, { x: 10, y: 20 })
    expect(rect).toEqual({ left: 10, top: 20, right: 30, bottom: 40 })
    expect(containsPoint(rect, { x: 10, y: 40 })).toBe(true)
    expect(containsPoint(rect, { x: 30, y: 20 })).toBe(true)
    expect(containsPoint(rect, { x: 30.01, y: 20 })).toBe(false)
  })

  it('freezes the selected region and releases only its IDs, then all remaining particles', () => {
    const particles = [particle(1, 10, 10), particle(2, 20, 20), particle(3, 50, 50, { frozen: true }), particle(4, 80, 80)]
    const selected = freezeRegion(particles, rectangleFromPoints({ x: 20, y: 20 }, { x: 10, y: 10 }))
    expect([...selected]).toEqual([1, 2])
    expect(particles.map(p => p.frozen)).toEqual([true, true, true, false])
    releaseSelected(particles, selected)
    expect(particles.map(p => p.frozen)).toEqual([false, false, true, false])
    releaseAll(particles)
    expect(particles.every(p => !p.frozen)).toBe(true)
  })

  it('returns the nearest particle within the inclusive hit radius', () => {
    const particles = [particle(1, 10, 0), particle(2, 4, 0)]
    expect(nearestParticle(particles, { x: 0, y: 0 }, 10)?.id).toBe(2)
    expect(nearestParticle([particles[0]], { x: 0, y: 0 }, 10)?.id).toBe(1)
    expect(nearestParticle(particles, { x: 0, y: 0 }, 3)).toBeUndefined()
    expect(nearestParticle([], { x: 0, y: 0 })).toBeUndefined()
  })
})

describe('gesture safeguards', () => {
  it('distinguishes slight click movement from rectangle dragging', () => {
    expect(isDrag({ x: 0, y: 0 }, { x: DRAG_THRESHOLD - 0.1, y: 0 })).toBe(false)
    expect(isDrag({ x: 0, y: 0 }, { x: DRAG_THRESHOLD, y: 0 })).toBe(true)
    expect(isDrag({ x: 10, y: 10 }, { x: 0, y: 0 })).toBe(true)
  })

  it.each(['a', 'button', 'input', 'textarea', 'select', 'label', '[data-content]', '[role="button"]'])('protects %s and its descendants from particle gestures', selector => {
    const element = document.createElement(selector.startsWith('[') ? 'div' : selector)
    if (selector === '[data-content]') element.dataset.content = ''
    if (selector === '[role="button"]') element.setAttribute('role', 'button')
    const child = document.createElement('span')
    element.append(child)
    expect(isProtectedTarget(element)).toBe(true)
    expect(isProtectedTarget(child)).toBe(true)
  })

  it('allows empty background targets and handles null safely', () => {
    expect(isProtectedTarget(document.createElement('div'))).toBe(false)
    expect(isProtectedTarget(null)).toBe(false)
  })
})
