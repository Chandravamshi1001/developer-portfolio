import { containsPoint, type Point, type Rectangle } from './geometry'

export interface Particle extends Point {
  id: number
  vx: number
  vy: number
  radius: number
  opacity: number
  frozen: boolean
  target?: Point
  phase: number
}

export function heartbeat(elapsed: number) {
  const phase = ((elapsed % 3.6) + 3.6) % 3.6
  return Math.exp(-(((phase - 0.32) / 0.12) ** 2)) + 0.62 * Math.exp(-(((phase - 0.65) / 0.16) ** 2))
}

export function createAmbientParticles(width: number, height: number, random = Math.random): Particle[] {
  const count = 2 * Math.min(110, Math.max(25, Math.floor(width * height / 12500)))
  return Array.from({ length: count }, (_, id) => ({ id, x: random() * width, y: random() * height, vx: (random() - 0.5) * 11, vy: -4 - random() * 9, radius: 0.5 + random() * 1.1, opacity: 0.2 + random() * 0.5, frozen: false, phase: random() * Math.PI * 2 }))
}

export function freezeParticle(particle: Particle) { particle.frozen = true }
export function releaseParticle(particle: Particle) { particle.frozen = false }
export function freezeRegion(particles: Particle[], rectangle: Rectangle): Set<number> {
  const selected = new Set<number>()
  for (const particle of particles) if (containsPoint(rectangle, particle)) { freezeParticle(particle); selected.add(particle.id) }
  return selected
}
export function releaseSelected(particles: Particle[], selected: ReadonlySet<number>) {
  for (const particle of particles) if (selected.has(particle.id)) releaseParticle(particle)
}
export function releaseAll(particles: Particle[]) { for (const particle of particles) releaseParticle(particle) }

export function stepParticles(particles: Particle[], dt: number, elapsed: number, width: number, height: number, pointer?: Point, reducedMotion = false) {
  const seconds = Math.min(Math.max(dt, 0), 0.04)
  for (const particle of particles) {
    if (particle.frozen) continue
    if (reducedMotion) {
      if (particle.target) { particle.x = particle.target.x; particle.y = particle.target.y }
      continue
    }
    if (particle.target) {
      const beat = heartbeat(elapsed)
      const spread = 3 * beat
      const x = particle.target.x + Math.cos(particle.phase) * spread
      const y = particle.target.y + Math.sin(particle.phase) * spread
      const ease = 1 - Math.exp(-12 * seconds)
      particle.x += (x - particle.x) * ease
      particle.y += (y - particle.y) * ease
    } else {
      particle.x += particle.vx * seconds
      particle.y += particle.vy * seconds
      if (particle.x < -5) particle.x = width + 5
      if (particle.x > width + 5) particle.x = -5
      if (particle.y < -5) particle.y = height + 5
      if (particle.y > height + 5) particle.y = -5
    }
    if (pointer) {
      const dx = particle.x - pointer.x, dy = particle.y - pointer.y
      const distance = Math.hypot(dx, dy)
      if (distance > 0 && distance < 85) {
        const force = (1 - distance / 85) * 38 * seconds
        particle.x += dx / distance * force
        particle.y += dy / distance * force
      }
    }
  }
}
