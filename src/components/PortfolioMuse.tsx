import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { localMuseDots, type MuseDot, type MuseFormation, type MuseGroup } from '../features/muse/geometry'
import './PortfolioMuse.css'

export interface MuseRequest { sequence: number; direction: -1 | 0 | 1 }
type Pose = 'wave' | 'idle' | 'run' | 'fall'
interface Action { pose: Pose; direction: -1 | 0 | 1; source: 'greeting' | 'navigation' | 'scroll' | 'click'; take: number }

function Dots({ dots, group }: { dots: readonly MuseDot[]; group: MuseGroup }) {
  return <>{dots.filter(dot => dot.group === group).map(dot => <circle key={dot.id} data-particle-id={dot.id} className={`muse-dot${group === 'eyes' ? ' muse-eye' : ''}`} cx={dot.x} cy={dot.y} r={dot.radius} opacity={dot.opacity} />)}</>
}

export function PortfolioMuse({ request, formation }: { request?: MuseRequest; formation?: MuseFormation }) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [curious, setCurious] = useState(false)
  const dots = localMuseDots(formation)
  const [lastRequest, setLastRequest] = useState(request)
  const [action, setAction] = useState<Action>(() => ({ pose: request?.direction ? 'run' : reducedMotion ? 'idle' : 'wave', direction: request?.direction ?? 1, source: request ? 'navigation' : 'greeting', take: 0 }))
  const scrollStop = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const button = buttonRef.current
    if (!button || reducedMotion || !finePointer) return
    let frame = 0
    let point = { x: 0, y: 0 }
    const draw = () => {
      frame = 0
      const bounds = button.getBoundingClientRect()
      const dx = point.x - (bounds.left + bounds.width / 2)
      const dy = point.y - (bounds.top + bounds.height / 3)
      button.style.setProperty('--muse-gaze-x', `${Math.max(-3, Math.min(3, dx / 90))}px`)
      button.style.setProperty('--muse-gaze-y', `${Math.max(-2, Math.min(2, dy / 110))}px`)
      button.style.setProperty('--muse-smile', String(1 + Math.max(0, 1 - Math.hypot(dx, dy) / 350) * .5))
      setCurious(Math.hypot(dx, dy) < 350)
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      point = { x: event.clientX, y: event.clientY }
      if (!frame) frame = requestAnimationFrame(draw)
    }
    const reset = () => {
      cancelAnimationFrame(frame); frame = 0
      button.style.removeProperty('--muse-gaze-x')
      button.style.removeProperty('--muse-gaze-y')
      button.style.removeProperty('--muse-smile')
      setCurious(false)
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('blur', reset)
    document.documentElement.addEventListener('pointerleave', reset)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('blur', reset)
      document.documentElement.removeEventListener('pointerleave', reset)
      reset()
    }
  }, [finePointer, reducedMotion])

  // Synchronize navigation without replacing the SVG or restarting its stride.
  if (request !== lastRequest) {
    setLastRequest(request)
    setAction(previous => ({ pose: request?.direction ? 'run' : 'idle', direction: request?.direction ?? 0, source: 'navigation', take: previous.take + 1 }))
  }

  useEffect(() => {
    let previousY = window.scrollY
    const scroll = () => {
      const nextY = window.scrollY
      const delta = nextY - previousY
      previousY = nextY
      if (Math.abs(delta) < .5) return
      const direction = delta > 0 ? 1 : -1
      setAction(previous => previous.pose === 'run' && previous.source === 'scroll' && previous.direction === direction ? previous : { pose: 'run', direction, source: 'scroll', take: previous.take + 1 })
      clearTimeout(scrollStop.current)
      scrollStop.current = setTimeout(() => setAction(previous => previous.source === 'scroll' ? { ...previous, pose: 'idle' } : previous), 180)
    }
    window.addEventListener('scroll', scroll, { passive: true })
    return () => { window.removeEventListener('scroll', scroll); clearTimeout(scrollStop.current) }
  }, [])

  useEffect(() => {
    if (action.pose === 'idle' || action.source === 'scroll') return
    const duration = action.pose === 'wave' ? 2100 : action.pose === 'fall' ? 1600 : 1100
    const timer = setTimeout(() => setAction(previous => ({ ...previous, pose: 'idle' })), duration)
    return () => clearTimeout(timer)
  }, [action.pose, action.source, action.take])

  const pose = reducedMotion && action.pose === 'wave' ? 'idle' : action.pose
  const expression = pose === 'fall' ? 'tumble' : pose === 'run' ? 'run' : curious && !reducedMotion ? 'curious' : 'smile'
  return <button ref={buttonRef} type="button" className="portfolio-muse muse-placement" aria-label="Make Muse tumble" title="Muse · click for a tumble" data-muse-pose={pose} data-muse-expression={expression} data-muse-direction={action.direction < 0 ? 'left' : action.direction > 0 ? 'right' : 'none'} data-muse-source={action.source} data-muse-take={action.take} data-reduced-motion={reducedMotion} onClick={() => {
    clearTimeout(scrollStop.current)
    setAction(previous => ({ ...previous, pose: 'fall', source: 'click', take: previous.take + 1 }))
  }}>
    <span className="muse-travel" aria-hidden="true"><span className="muse-facing">
      <svg className="muse-character" viewBox="0 0 120 140" focusable="false" aria-hidden="true">
        <g className="muse-shed">{pose === 'run' && !reducedMotion && Array.from({ length: 12 }, (_, index) => <circle key={index} cx={[34, 49, 71, 85][index % 4]} cy={[84, 118, 118, 77][index % 4]} r={1.3 + index % 2 * .3} style={{ animationDelay: `${-index * .075}s`, '--shed-drift': `${(index % 3 - 1) * 8}px` } as React.CSSProperties} />)}</g>
        <g className="muse-figure">
          <g className="muse-leg muse-leg-left"><Dots dots={dots} group="leg-left" /></g>
          <g className="muse-leg muse-leg-right"><Dots dots={dots} group="leg-right" /></g>
          <Dots dots={dots} group="body" />
          <g className="muse-arm muse-arm-left"><Dots dots={dots} group="arm-left" /></g>
          <g className="muse-arm muse-arm-right"><Dots dots={dots} group="arm-right" /></g>
          <g className="muse-head"><Dots dots={dots} group="head" />
            <g className="muse-gaze"><g className="muse-look"><g className="muse-eyes"><Dots dots={dots} group="eyes" /></g><g className="muse-mouth"><Dots dots={dots} group="mouth" /></g></g></g>
          </g>
        </g>
      </svg>
    </span></span>
  </button>
}
