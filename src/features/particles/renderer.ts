import { type Particle } from './physics'
import type { Rectangle } from './geometry'

/** Convert the name's current viewport bounds back to its Home presentation bounds. */
export function homeNameRectangle(rectangle: DOMRect, scrollY: number, horizontal: boolean, trackOffsetX = 0): DOMRect {
  return new DOMRect(rectangle.left - (horizontal ? trackOffsetX : 0), rectangle.top + (horizontal ? 0 : scrollY), rectangle.width, rectangle.height)
}

export function createNameParticles(lines: readonly string[], rectangle: DOMRect, startId: number): Particle[] {
  const canvas = document.createElement('canvas')
  const width = Math.max(1, Math.floor(rectangle.width))
  const height = Math.max(1, Math.floor(rectangle.height))
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return []
  let fontSize = Math.min(100, width / 7, height / (Math.max(1, lines.length) * 1.16))
  context.font = `600 ${fontSize}px Arial, sans-serif`
  const maximumWidth = Math.max(...lines.map((line) => context.measureText(line).width))
  fontSize *= Math.min(1, width / maximumWidth)
  context.font = `600 ${fontSize}px Arial, sans-serif`
  context.fillStyle = '#fff'
  context.textBaseline = 'middle'
  const lineHeight = fontSize * 1.16
  lines.forEach((line, index) => context.fillText(line, 0, (height - lines.length * lineHeight) / 2 + lineHeight * (index + 0.5)))
  const pixels = context.getImageData(0, 0, width, height).data
  const points: Particle[] = []
  const gap = width < 500 ? 3 : 4
  for (let y = 0; y < height; y += gap) for (let x = 0; x < width; x += gap) {
    if (pixels[(y * width + x) * 4 + 3] > 110) {
      const target = { x: x + rectangle.left, y: y + rectangle.top }
      points.push({ id: startId + points.length, ...target, target, vx: 0, vy: 0, radius: gap === 3 ? 1.1 : 1.5, opacity: 0.9, frozen: false, phase: (x * 0.73 + y * 0.31) % (Math.PI * 2) })
    }
  }
  // Limit raster complexity even on unusually wide screens.
  return points.filter((_, index) => index % Math.max(1, Math.ceil(points.length / 1800)) === 0)
}

export function renderParticles(context: CanvasRenderingContext2D, particles: Particle[], width: number, height: number, homeOpacity: number, selection?: Rectangle) {
  context.clearRect(0, 0, width, height)
  for (const particle of particles) {
    const opacity = particle.opacity * (particle.target && !particle.frozen ? homeOpacity : 1)
    if (opacity < 0.01) continue
    context.fillStyle = `rgba(245,247,250,${opacity})`
    context.beginPath()
    context.arc(particle.x, particle.y, particle.radius + (particle.frozen ? 0.35 : 0), 0, Math.PI * 2)
    context.fill()
  }
  if (selection) {
    context.fillStyle = 'rgba(255,255,255,0.045)'
    context.strokeStyle = 'rgba(255,255,255,0.65)'
    context.setLineDash([4, 4])
    context.fillRect(selection.left, selection.top, selection.right - selection.left, selection.bottom - selection.top)
    context.strokeRect(selection.left, selection.top, selection.right - selection.left, selection.bottom - selection.top)
    context.setLineDash([])
  }
}
