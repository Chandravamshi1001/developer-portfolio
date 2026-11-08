import type { Particle } from '../particles/physics'

export const MUSE_START_ID = 20000
export type MuseGroup = 'head' | 'body' | 'arm-left' | 'arm-right' | 'leg-left' | 'leg-right' | 'eyes' | 'mouth'
export interface MuseDot { id: number; x: number; y: number; radius: number; opacity: number; group: MuseGroup }
export interface MuseBounds { left: number; top: number; width: number; height: number }
export interface MuseFormation { particles: Particle[]; bounds: MuseBounds }

function ellipse(group: MuseGroup, cx: number, cy: number, rx: number, ry: number): Omit<MuseDot, 'id'>[] {
  const dots: Omit<MuseDot, 'id'>[] = []
  for (let y = -ry; y <= ry; y += 3) for (let x = -rx; x <= rx; x += 3) {
    const distance = (x / rx) ** 2 + (y / ry) ** 2
    if (distance <= 1) dots.push({ x: cx + x, y: cy + y, radius: .95, opacity: distance > .68 ? .94 : .64, group })
  }
  return dots
}

/** One deterministic silhouette, shared by the collision canvas and the live SVG. */
export const MUSE_DOTS: readonly MuseDot[] = [
  ...ellipse('leg-left', 49, 118, 10, 10),
  ...ellipse('leg-right', 71, 118, 10, 10),
  ...ellipse('body', 60, 87, 21, 25),
  ...ellipse('arm-left', 34, 84, 8, 13),
  ...ellipse('arm-right', 85, 77, 8, 13),
  ...ellipse('head', 60, 41, 30, 27).filter(dot => Math.hypot(dot.x - 49, dot.y - 42) > 5 && Math.hypot(dot.x - 71, dot.y - 42) > 5 && !(dot.x >= 46 && dot.x <= 74 && dot.y >= 49 && dot.y <= 61)),
  { x: 49, y: 42, radius: 2.6, opacity: 1, group: 'eyes' as const },
  { x: 71, y: 42, radius: 2.6, opacity: 1, group: 'eyes' as const },
  ...Array.from({ length: 9 }, (_, index) => ({ x: 48 + index * 3, y: 52 + 6 * Math.sin(index / 8 * Math.PI), radius: 1.6, opacity: 1, group: 'mouth' as const })),
].map((dot, index) => ({ ...dot, id: MUSE_START_ID + index }))

function transform(bounds: MuseBounds) {
  const scale = Math.max(.001, Math.min(bounds.width / 120, bounds.height / 140))
  return { scale, x: bounds.left + (bounds.width - 120 * scale) / 2, y: bounds.top + (bounds.height - 140 * scale) / 2 }
}

export function createMuseParticles(bounds: MuseBounds): Particle[] {
  const { scale, x, y } = transform(bounds)
  return MUSE_DOTS.map(dot => {
    const target = { x: x + dot.x * scale, y: y + dot.y * scale }
    return { id: dot.id, ...target, target, radius: dot.radius * scale, opacity: dot.opacity, phase: dot.id * .73, vx: 0, vy: 0, frozen: false }
  })
}

/** Retarget in place so an in-flight collision never creates a second muse. */
export function retargetMuseParticles(particles: Particle[], bounds: MuseBounds) {
  const targets = createMuseParticles(bounds)
  particles.forEach((particle, index) => {
    const target = targets[index]
    if (target?.id === particle.id) { particle.target = target.target; particle.radius = target.radius }
  })
}

export function localMuseDots(formation?: MuseFormation): readonly MuseDot[] {
  if (!formation) return MUSE_DOTS
  const { scale, x, y } = transform(formation.bounds)
  const particles = new Map(formation.particles.map(particle => [particle.id, particle]))
  return MUSE_DOTS.map(dot => {
    const particle = particles.get(dot.id)
    return particle ? { ...dot, x: (particle.x - x) / scale, y: (particle.y - y) / scale, radius: particle.radius / scale, opacity: particle.opacity } : dot
  })
}
