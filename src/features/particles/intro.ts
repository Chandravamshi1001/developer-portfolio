import type { Point } from './geometry'
import type { Particle } from './physics'

export const INTRO_TIMING = { hold: .45, collision: 1.8, settle: 4.8 } as const
interface Path { from: Point; c1: Point; c2: Point; to: Point; start: number; duration: number }
export interface IntroState {
  particles: Particle[]
  elapsed: number
  phase: 'approach' | 'burst' | 'complete'
  born: boolean
  origin: Point
  stars: [Point, Point]
  width: number
  height: number
  paths: Map<number, Path>
}

const clamp = (value: number) => Math.max(0, Math.min(1, value))
const pointOnPath = (path: Path, time: number): Point => {
  const t = clamp((time - path.start) / path.duration), u = 1 - t
  return {
    x: u ** 3 * path.from.x + 3 * u * u * t * path.c1.x + 3 * u * t * t * path.c2.x + t ** 3 * path.to.x,
    y: u ** 3 * path.from.y + 3 * u * u * t * path.c1.y + 3 * u * t * t * path.c2.y + t ** 3 * path.to.y,
  }
}
const velocityOnPath = (path: Path, time: number): Point => {
  const t = clamp((time - path.start) / path.duration), u = 1 - t
  return {
    x: 3 * (u * u * (path.c1.x - path.from.x) + 2 * u * t * (path.c2.x - path.c1.x) + t * t * (path.to.x - path.c2.x)) / path.duration,
    y: 3 * (u * u * (path.c1.y - path.from.y) + 2 * u * t * (path.c2.y - path.c1.y) + t * t * (path.to.y - path.c2.y)) / path.duration,
  }
}

function stars(state: IntroState) {
  const t = clamp((state.elapsed - INTRO_TIMING.hold) / (INTRO_TIMING.collision - INTRO_TIMING.hold))
  const distance = state.width * .32 * (1 - t ** 3)
  state.stars = [{ x: state.origin.x - distance, y: state.origin.y }, { x: state.origin.x + distance, y: state.origin.y }]
}

export function createIntro(particles: Particle[], width: number, height: number): IntroState {
  const state: IntroState = { particles, width, height, origin: { x: width / 2, y: height / 2 }, stars: [{ x: 0, y: 0 }, { x: 0, y: 0 }], elapsed: 0, phase: 'approach', born: false, paths: new Map() }
  stars(state)
  return state
}

function birth(state: IntroState) {
  const duration = INTRO_TIMING.settle - INTRO_TIMING.collision
  for (const particle of state.particles) {
    const angle = particle.phase + particle.id * 2.3999632297
    const dx = Math.cos(angle), dy = Math.sin(angle)
    const edge = Math.min(state.width * .47 / Math.max(.001, Math.abs(dx)), state.height * .47 / Math.max(.001, Math.abs(dy)))
    const distance = edge * (.32 + .65 * ((Math.sin(particle.id * 12.9898) + 1) / 2))
    const to = particle.target ? { ...particle.target } : { x: state.origin.x + dx * distance, y: state.origin.y + dy * distance }
    const reach = particle.target ? Math.min(state.width, state.height) * (.55 + (particle.id % 11) / 30) : distance * .8
    const c1 = { x: state.origin.x + dx * reach, y: state.origin.y + dy * reach }
    // Name curves end at rest. Ambient curves end at the ordinary physics
    // velocity, so the very same objects continue without a completion reset.
    const c2 = particle.target ? { ...to } : { x: to.x - particle.vx * duration / 3, y: to.y - particle.vy * duration / 3 }
    state.paths.set(particle.id, { from: { ...state.origin }, c1, c2, to, start: INTRO_TIMING.collision, duration })
    particle.x = state.origin.x
    particle.y = state.origin.y
  }
  state.born = true
  state.phase = 'burst'
}

export function stepIntro(state: IntroState, dt: number) {
  if (state.phase === 'complete') return
  const next = state.elapsed + Math.max(0, Number.isFinite(dt) ? dt : 0)
  if (!state.born && next >= INTRO_TIMING.collision) {
    // Keep one exact impact sample: both populations are born at this event.
    state.elapsed = INTRO_TIMING.collision
    birth(state)
    stars(state)
    return
  }
  state.elapsed = Math.min(INTRO_TIMING.settle, next)
  stars(state)
  if (!state.born) return
  for (const particle of state.particles) {
    const path = state.paths.get(particle.id)
    if (path) Object.assign(particle, pointOnPath(path, state.elapsed))
  }
  if (state.elapsed >= INTRO_TIMING.settle) state.phase = 'complete'
}

export function finishIntro(state: IntroState) {
  if (!state.born) birth(state)
  stepIntro(state, INTRO_TIMING.settle)
}

/** Resize retargets remaining paths without changing any current particle position. */
export function resizeIntro(state: IntroState, width: number, height: number) {
  const previousWidth = state.width, previousHeight = state.height
  state.width = width
  state.height = height
  state.origin = { x: width / 2, y: height / 2 }
  stars(state)
  if (state.phase !== 'burst') return
  const duration = Math.max(.001, INTRO_TIMING.settle - state.elapsed)
  for (const particle of state.particles) {
    const path = state.paths.get(particle.id)
    if (!path) continue
    const velocity = velocityOnPath(path, state.elapsed)
    const to = particle.target ? { ...particle.target } : { x: path.to.x * width / previousWidth, y: path.to.y * height / previousHeight }
    state.paths.set(particle.id, {
      from: { x: particle.x, y: particle.y },
      c1: { x: particle.x + velocity.x * duration / 3, y: particle.y + velocity.y * duration / 3 },
      c2: particle.target ? { ...to } : { x: to.x - particle.vx * duration / 3, y: to.y - particle.vy * duration / 3 },
      to, start: state.elapsed, duration,
    })
  }
}
