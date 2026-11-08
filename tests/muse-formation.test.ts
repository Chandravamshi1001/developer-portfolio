import { describe, expect, it } from 'vitest'
import { createMuseParticles, localMuseDots, MUSE_DOTS, MUSE_START_ID, retargetMuseParticles } from '../src/features/muse/geometry'
import { createIntro, finishIntro, INTRO_TIMING, resizeIntro, stepIntro } from '../src/features/particles/intro'

const bounds = { left: 1400, top: 500, width: 88, height: 102 }

describe('Muse collision geometry and handoff', () => {
  it('creates one deterministic silhouette with unique reserved IDs and exactly two eyes', () => {
    const particles = createMuseParticles(bounds)
    expect(particles).toEqual(createMuseParticles(bounds))
    expect(new Set(particles.map(particle => particle.id)).size).toBe(particles.length)
    expect(Math.min(...particles.map(particle => particle.id))).toBe(MUSE_START_ID)
    expect(MUSE_START_ID).toBeGreaterThan(10000 + 1800)
    expect(MUSE_DOTS.filter(dot => dot.group === 'eyes')).toHaveLength(2)
    expect(new Set(MUSE_DOTS.map(dot => dot.group))).toEqual(new Set(['head', 'body', 'arm-left', 'arm-right', 'leg-left', 'leg-right', 'eyes', 'mouth']))
    expect(MUSE_DOTS.filter(dot => dot.group === 'mouth').length).toBeGreaterThan(2)
    for (const particle of particles) {
      expect(particle.x).toBeGreaterThanOrEqual(bounds.left)
      expect(particle.x).toBeLessThanOrEqual(bounds.left + bounds.width)
      expect(particle.y).toBeGreaterThanOrEqual(bounds.top)
      expect(particle.y).toBeLessThanOrEqual(bounds.top + bounds.height)
    }
  })

  it('births Muse at the same collision origin and hands its completed coordinates to SVG geometry', () => {
    const particles = createMuseParticles(bounds), refs = [...particles]
    const intro = createIntro(particles, 1536, 696)
    stepIntro(intro, INTRO_TIMING.collision)
    for (const [index, particle] of particles.entries()) {
      expect(particle).toBe(refs[index])
      expect({ x: particle.x, y: particle.y }).toEqual(intro.origin)
    }
    finishIntro(intro)
    expect(intro.phase).toBe('complete')
    const dots = localMuseDots({ particles, bounds })
    dots.forEach((dot, index) => {
      expect(dot.id).toBe(particles[index].id)
      expect(dot.x).toBeCloseTo(MUSE_DOTS[index].x)
      expect(dot.y).toBeCloseTo(MUSE_DOTS[index].y)
    })
    particles[0].x += 2
    expect(localMuseDots({ particles, bounds })[0].x).toBeGreaterThan(dots[0].x)
  })

  it('retargets mid-flight without replacing or teleporting any Muse particle', () => {
    const particles = createMuseParticles(bounds), refs = [...particles]
    const intro = createIntro(particles, 1536, 696)
    stepIntro(intro, INTRO_TIMING.collision)
    stepIntro(intro, .7)
    const before = particles.map(({ x, y }) => ({ x, y }))
    const mobile = { left: 304, top: 680, width: 68, height: 80 }
    retargetMuseParticles(particles, mobile)
    resizeIntro(intro, 390, 844)
    particles.forEach((particle, index) => {
      expect(particle).toBe(refs[index])
      expect({ x: particle.x, y: particle.y }).toEqual(before[index])
    })
    finishIntro(intro)
    const expected = createMuseParticles(mobile)
    particles.forEach((particle, index) => {
      expect(particle.x).toBeCloseTo(expected[index].x)
      expect(particle.y).toBeCloseTo(expected[index].y)
    })
  })
})
