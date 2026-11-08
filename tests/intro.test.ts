import { describe, expect, it } from 'vitest'
import { createIntro, finishIntro, INTRO_TIMING, resizeIntro, stepIntro } from '../src/features/particles/intro'
import { freezeParticle, releaseParticle, stepParticles, type Particle } from '../src/features/particles/physics'

function particles(): Particle[] {
  return [
    { id: 0, x: 120, y: 90, vx: 7, vy: -8, radius: 1, opacity: .5, frozen: false, phase: .2 },
    { id: 1, x: 700, y: 400, vx: -5, vy: -9, radius: 1, opacity: .6, frozen: false, phase: 3.2 },
    { id: 10000, x: 110, y: 130, target: { x: 110, y: 130 }, vx: 0, vy: 0, radius: 1, opacity: .9, frozen: false, phase: 1 },
    { id: 10001, x: 270, y: 190, target: { x: 270, y: 190 }, vx: 0, vy: 0, radius: 1, opacity: .9, frozen: false, phase: 2 },
  ]
}

function advanceUntil(state: ReturnType<typeof createIntro>, reached: () => boolean) {
  for (let frame = 0; frame < 1000 && !reached(); frame++) stepIntro(state, 1 / 60)
  expect(reached()).toBe(true)
}

describe('two-star universe phase model', () => {
  it('starts with exactly two distinct stars, no particle birth, and retains the supplied simulation objects', () => {
    const field = particles(), before = structuredClone(field)
    const intro = createIntro(field, 1200, 750)
    expect(intro.particles).toBe(field)
    expect(intro.stars).toHaveLength(2)
    expect(intro.stars[0]).not.toEqual(intro.stars[1])
    expect(intro.born).toBe(false)
    expect(intro.phase).toBe('approach')
    expect(intro.elapsed).toBe(0)
    expect(field).toEqual(before)
  })

  it('holds briefly, converges continuously, and births both particle groups at exactly the same collision origin', () => {
    const field = particles(), refs = [...field]
    const intro = createIntro(field, 1200, 750)
    const initialStars = structuredClone(intro.stars)
    for (let frame = 0; frame < 10; frame++) stepIntro(intro, 1 / 60)
    expect(intro.elapsed).toBeLessThan(INTRO_TIMING.hold)
    expect(intro.stars).toEqual(initialStars)
    advanceUntil(intro, () => intro.elapsed > (INTRO_TIMING.hold + INTRO_TIMING.collision) / 2)
    const distance = (point: { x: number; y: number }) => Math.hypot(point.x - intro.origin.x, point.y - intro.origin.y)
    intro.stars.forEach((star, index) => expect(distance(star)).toBeLessThan(distance(initialStars[index])))
    expect(intro.born).toBe(false)
    advanceUntil(intro, () => intro.born)
    expect(intro.phase).toBe('burst')
    intro.stars.forEach(star => expect(star).toMatchObject(intro.origin))
    for (const [index, particle] of field.entries()) {
      expect(particle).toBe(refs[index])
      expect({ x: particle.x, y: particle.y }).toEqual(intro.origin)
    }
    // No later threshold, independently created group, or second birth event.
    stepIntro(intro, 1 / 60)
    expect(field.filter(particle => !particle.target).some(particle => distance(particle) > 0)).toBe(true)
    expect(field.filter(particle => particle.target).some(particle => distance(particle) > 0)).toBe(true)
  })

  it('moves name particles along outward curves into the existing raster targets', () => {
    const field = particles(), targets = field.filter(particle => particle.target).map(particle => ({ ...particle.target! }))
    const intro = createIntro(field, 1200, 750)
    advanceUntil(intro, () => intro.born)
    advanceUntil(intro, () => intro.elapsed > INTRO_TIMING.collision + (INTRO_TIMING.settle - INTRO_TIMING.collision) * .4)
    for (const [index, particle] of field.filter(particle => particle.target).entries()) {
      const target = targets[index]
      const cross = (particle.x - intro.origin.x) * (target.y - intro.origin.y) - (particle.y - intro.origin.y) * (target.x - intro.origin.x)
      expect(Math.abs(cross)).toBeGreaterThan(1)
      expect(particle.target).toEqual(target)
    }
    advanceUntil(intro, () => intro.phase === 'complete')
    field.filter(particle => particle.target).forEach((particle, index) => {
      expect(particle.x).toBeCloseTo(targets[index].x, 6)
      expect(particle.y).toBeCloseTo(targets[index].y, 6)
    })
  })

  it('hands the same ambient objects to ordinary physics without a completion jump or reseed', () => {
    const field = particles(), refs = [...field], ids = field.map(particle => particle.id)
    const intro = createIntro(field, 1200, 750)
    advanceUntil(intro, () => intro.elapsed >= INTRO_TIMING.settle - .04)
    const before = field.map(particle => ({ x: particle.x, y: particle.y }))
    stepIntro(intro, 1 / 60)
    stepIntro(intro, 1 / 60)
    stepIntro(intro, 1 / 60)
    expect(intro.phase).toBe('complete')
    expect(intro.particles).toBe(field)
    expect(field.map(particle => particle.id)).toEqual(ids)
    field.forEach((particle, index) => {
      expect(particle).toBe(refs[index])
      expect(Math.hypot(particle.x - before[index].x, particle.y - before[index].y)).toBeLessThan(5)
    })
    const ambient = field.filter(particle => !particle.target)
    const endpoint = ambient.map(particle => ({ x: particle.x, y: particle.y }))
    stepParticles(field, .01, 10, 1200, 750)
    ambient.forEach((particle, index) => {
      expect(particle.x).toBeCloseTo(endpoint[index].x + particle.vx * .01, 6)
      expect(particle.y).toBeCloseTo(endpoint[index].y + particle.vy * .01, 6)
    })
  })

  it('resizes mid-burst without teleporting or replacing any current particle', () => {
    const field = particles(), refs = [...field]
    const intro = createIntro(field, 1200, 750)
    advanceUntil(intro, () => intro.elapsed > INTRO_TIMING.collision + .8)
    const before = field.map(particle => ({ x: particle.x, y: particle.y }))
    resizeIntro(intro, 800, 600)
    expect(intro.particles).toBe(field)
    field.forEach((particle, index) => {
      expect(particle).toBe(refs[index])
      expect({ x: particle.x, y: particle.y }).toEqual(before[index])
    })
    stepIntro(intro, .001)
    field.forEach((particle, index) => expect(Math.hypot(particle.x - before[index].x, particle.y - before[index].y)).toBeLessThan(3))
    advanceUntil(intro, () => intro.phase === 'complete')
    field.forEach((particle, index) => expect(particle).toBe(refs[index]))
  })

  it('supports skip using the same objects and hands the name to heartbeat motion with working freeze/release', () => {
    const field = particles(), refs = [...field]
    const intro = createIntro(field, 1200, 750)
    finishIntro(intro)
    expect(intro.phase).toBe('complete')
    expect(intro.born).toBe(true)
    field.forEach((particle, index) => expect(particle).toBe(refs[index]))
    const names = field.filter(particle => particle.target)
    const before = names.map(particle => ({ x: particle.x, y: particle.y }))
    for (let frame = 0; frame < 24; frame++) stepParticles(field, 1 / 60, frame / 60, 1200, 750)
    names.forEach((particle, index) => {
      const displacement = Math.hypot(particle.x - before[index].x, particle.y - before[index].y)
      expect(displacement).toBeGreaterThan(1)
      expect(displacement).toBeLessThan(4)
    })
    const ambient = field.find(particle => !particle.target)!
    freezeParticle(ambient)
    const frozen = { x: ambient.x, y: ambient.y }
    stepParticles(field, .02, 3, 1200, 750)
    expect({ x: ambient.x, y: ambient.y }).toEqual(frozen)
    releaseParticle(ambient)
    stepParticles(field, .02, 3.02, 1200, 750)
    expect({ x: ambient.x, y: ambient.y }).not.toEqual(frozen)
  })
})
