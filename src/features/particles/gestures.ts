import type { Point } from './geometry'

export const DRAG_THRESHOLD = 7
export function isDrag(start: Point, end: Point) { return Math.hypot(end.x - start.x, end.y - start.y) >= DRAG_THRESHOLD }
export function isProtectedTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('a, button, input, textarea, select, label, [data-content], [role="button"]'))
}
