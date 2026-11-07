export interface Point { x: number; y: number }
export interface Rectangle { left: number; top: number; right: number; bottom: number }

export function rectangleFromPoints(a: Point, b: Point): Rectangle {
  return { left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), right: Math.max(a.x, b.x), bottom: Math.max(a.y, b.y) }
}

export function containsPoint(rectangle: Rectangle, point: Point) {
  return point.x >= rectangle.left && point.x <= rectangle.right && point.y >= rectangle.top && point.y <= rectangle.bottom
}

export function nearestParticle<T extends Point>(particles: readonly T[], point: Point, radius = 16): T | undefined {
  let nearest: T | undefined
  let distance = radius * radius
  for (const particle of particles) {
    const squared = (particle.x - point.x) ** 2 + (particle.y - point.y) ** 2
    if (squared <= distance) { nearest = particle; distance = squared }
  }
  return nearest
}
