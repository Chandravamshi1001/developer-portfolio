import { useEffect, useRef, useState } from 'react'
import { portfolio } from '../../content/portfolio'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { containsPoint, nearestParticle, rectangleFromPoints, type Point, type Rectangle } from './geometry'
import { isDrag, isProtectedTarget } from './gestures'
import { createAmbientParticles, freezeParticle, freezeRegion, releaseAll, releaseParticle, releaseSelected, stepParticles, type Particle } from './physics'
import { createNameParticles, homeNameRectangle, renderIntro, renderParticles } from './renderer'
import { createIntro, finishIntro, resizeIntro, stepIntro, type IntroState } from './intro'
import { createMuseParticles, retargetMuseParticles, type MuseBounds, type MuseFormation } from '../muse/geometry'

interface FieldState { particles: Particle[]; selected: Set<number>; selection?: Rectangle; pointer?: Point }

interface ParticleFieldProps { playIntro?: boolean; onIntroActiveChange?: (active: boolean) => void; onMuseFormed?: (formation: MuseFormation) => void }

export function ParticleField({ playIntro = false, onIntroActiveChange, onMuseFormed }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const state = useRef<FieldState>({ particles: [], selected: new Set() })
  const [paused, setPaused] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [frozenCount, setFrozenCount] = useState(0)
  const [selectedCount, setSelectedCount] = useState(0)
  const [introActive, setIntroActive] = useState(playIntro)
  const [canvasAvailable, setCanvasAvailable] = useState(true)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [keyboardRect, setKeyboardRect] = useState<Rectangle>({ left: 30, top: 160, right: 230, bottom: 300 })
  const settings = useRef({ paused, selecting, reducedMotion })
  const controls = useRef({ draw: () => {}, restart: () => {}, skip: () => {}, replay: () => {} })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const museAnchor = document.querySelector<HTMLElement>('[data-muse-anchor]')
    const measureMuse = (): MuseBounds | undefined => {
      const rectangle = museAnchor?.getBoundingClientRect()
      return rectangle ? { left: rectangle.left, top: rectangle.top, width: rectangle.width, height: rectangle.height } : undefined
    }
    const context = canvas.getContext('2d')
    if (!context) {
      setCanvasAvailable(false)
      setIntroActive(false)
      const bounds = measureMuse()
      if (playIntro && bounds) onMuseFormed?.({ particles: createMuseParticles(bounds), bounds })
      onIntroActiveChange?.(false)
      const app = canvas.closest('.portfolio-app')
      app?.classList.add('has-static-name')
      return () => { app?.classList.remove('has-static-name') }
    }
    const field = state.current
    let frame = 0, lastTime = 0, elapsed = 0
    let replayFrame = 0
    let intro: IntroState | undefined
    let museParticles: Particle[] = []
    let museBounds: MuseBounds | undefined
    let width = window.innerWidth, height = window.innerHeight
    let dragStart: Point | undefined
    let pointerId: number | undefined
    let touchStart: { point: Point; id: number; moved: boolean } | undefined

    const updateCounts = () => {
      setFrozenCount(field.particles.filter((particle) => particle.frozen).length)
      setSelectedCount(field.selected.size)
    }
    const homeOpacity = () => Math.max(0, 1 - window.scrollY / Math.max(1, height * 0.6))
    const visibleParticles = () => field.particles.filter((particle) => !particle.target || particle.frozen || homeOpacity() > 0.4)
    const isIntro = () => Boolean(intro && intro.phase !== 'complete')
    const draw = () => {
      canvas.dataset.introPhase = intro?.phase ?? 'complete'
      if (intro && isIntro()) renderIntro(context, intro)
      else renderParticles(context, field.particles, width, height, homeOpacity(), field.selection)
    }
    const complete = () => {
      if (museBounds && museParticles.length) onMuseFormed?.({ particles: museParticles, bounds: museBounds })
      setIntroActive(false)
      onIntroActiveChange?.(false)
    }
    const resize = () => {
      width = window.innerWidth; height = window.innerHeight
      const scale = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * scale); canvas.height = Math.floor(height * scale)
      context.setTransform(scale, 0, 0, scale, 0, 0)
      const frozen = field.particles.filter((particle) => particle.frozen)
      const nextId = 0
      const ambient = createAmbientParticles(width, height).map((particle) => ({ ...particle, id: particle.id + nextId }))
      const nameArea = document.querySelector('[data-particle-name]')
      const horizontal = Boolean(document.querySelector('.is-horizontal'))
      const track = document.querySelector('.section-track')
      const transform = track ? getComputedStyle(track).transform : 'none'
      const trackOffset = transform && transform !== 'none' ? new DOMMatrixReadOnly(transform).m41 : 0
      const nameBounds = nameArea ? homeNameRectangle(nameArea.getBoundingClientRect(), window.scrollY, horizontal, trackOffset) : undefined
      const name = nameBounds ? createNameParticles(portfolio.nameLines, nameBounds, 10000) : []
      if (intro && isIntro()) {
        // Preserve the collision-born population while adapting its destinations
        // to the new text raster. No particle teleports or second birth event.
        const existingName = field.particles.filter(particle => particle.target)
        existingName.forEach((particle, index) => {
          const destination = name[Math.min(name.length - 1, Math.floor(index * name.length / existingName.length))]
          if (destination?.target) particle.target = { ...destination.target }
        })
        const bounds = measureMuse()
        if (bounds && museParticles.length) {
          museBounds = bounds
          retargetMuseParticles(museParticles, bounds)
        }
        resizeIntro(intro, width, height)
      } else {
        const frozenIds = new Set(frozen.map((particle) => particle.id))
        field.particles = [...frozen, ...ambient.filter((particle) => !frozenIds.has(particle.id)), ...name.filter((particle) => !frozenIds.has(particle.id))]
      }
      draw()
    }
    const animate = (time: number) => {
      const dt = lastTime ? (time - lastTime) / 1000 : 0
      lastTime = time
      if (intro && isIntro()) {
        stepIntro(intro, Math.min(dt, .04))
        if (intro.phase === 'complete') complete()
      } else if (!settings.current.paused && !settings.current.reducedMotion) {
        elapsed += Math.min(dt, 0.04)
        stepParticles(field.particles, dt, elapsed, width, height, field.pointer)
      }
      draw()
      if (!document.hidden && (isIntro() || (!settings.current.paused && !settings.current.reducedMotion))) frame = requestAnimationFrame(animate)
    }
    const restart = () => { cancelAnimationFrame(frame); lastTime = 0; if (!document.hidden) frame = requestAnimationFrame(animate) }
    const getPoint = (event: PointerEvent): Point => ({ x: event.clientX, y: event.clientY })
    const down = (event: PointerEvent) => {
      if (isIntro()) return
      if (event.button !== 0 || isProtectedTarget(event.target)) return
      if (!(event.target instanceof Element) || !event.target.closest('[data-particle-surface]')) return
      if (event.pointerType === 'touch' && !settings.current.selecting) {
        if (!touchStart) touchStart = { point: getPoint(event), id: event.pointerId, moved: false }
        return
      }
      dragStart = getPoint(event); pointerId = event.pointerId
      if (settings.current.selecting) { field.selection = rectangleFromPoints(dragStart, dragStart); event.preventDefault() }
    }
    const move = (event: PointerEvent) => {
      if (isIntro()) return
      field.pointer = event.pointerType === 'mouse' && !isProtectedTarget(event.target) ? getPoint(event) : undefined
      if (touchStart && touchStart.id === event.pointerId && isDrag(touchStart.point, getPoint(event))) touchStart.moved = true
      if (dragStart && event.pointerId === pointerId && isDrag(dragStart, getPoint(event))) {
        field.selection = rectangleFromPoints(dragStart, getPoint(event)); draw()
      }
    }
    const up = (event: PointerEvent) => {
      if (isIntro()) return
      const point = getPoint(event)
      if (dragStart && pointerId === event.pointerId) {
        if (isDrag(dragStart, point)) field.selected = freezeRegion(visibleParticles(), rectangleFromPoints(dragStart, point))
        else {
          const particle = nearestParticle(visibleParticles(), point)
          if (particle) freezeParticle(particle)
        }
        dragStart = undefined; pointerId = undefined; field.selection = undefined
        updateCounts(); draw()
        return
      }
      if (event.pointerType === 'touch' && !settings.current.selecting && touchStart?.id === event.pointerId && !touchStart.moved && !isDrag(touchStart.point, point) && !isProtectedTarget(event.target)) {
        const particle = nearestParticle(visibleParticles(), point, 24)
        if (particle) {
          if (particle.frozen) releaseParticle(particle)
          else freezeParticle(particle)
          updateCounts(); draw()
        }
      }
      if (touchStart?.id === event.pointerId) touchStart = undefined
    }
    const doubleClick = (event: MouseEvent) => {
      if (isIntro()) return
      if (isProtectedTarget(event.target)) return
      const particle = nearestParticle(visibleParticles().filter((particle) => particle.frozen), event)
      if (particle) { releaseParticle(particle); updateCounts(); draw() }
    }
    const cancel = () => { dragStart = undefined; pointerId = undefined; touchStart = undefined; field.selection = undefined; field.pointer = undefined; draw() }
    const skip = () => {
      if (!intro || !isIntro()) return
      finishIntro(intro)
      complete()
      draw()
      restart()
    }
    const begin = () => {
      // Navigation has released its pin before replay's next animation frame.
      window.scrollTo({ top: 0, behavior: 'instant' })
      intro = field.particles.length ? createIntro(field.particles, width, height) : undefined
      resize()
      releaseAll(field.particles)
      field.selected.clear(); field.selection = undefined; field.pointer = undefined
      updateCounts()
      museBounds = onMuseFormed ? measureMuse() : undefined
      museParticles = museBounds ? createMuseParticles(museBounds) : []
      intro = createIntro(museParticles.length ? [...field.particles, ...museParticles] : field.particles, width, height)
      if (settings.current.reducedMotion) { finishIntro(intro); complete() }
      draw()
      restart()
    }
    const replay = () => {
      if (settings.current.reducedMotion) return
      setPaused(false); setSelecting(false)
      setIntroActive(true); onIntroActiveChange?.(true)
      cancelAnimationFrame(replayFrame)
      replayFrame = requestAnimationFrame(begin)
    }
    if (playIntro) begin()
    else { resize(); restart() }
    const nameObserver = new ResizeObserver(resize)
    const nameArea = document.querySelector('[data-particle-name]')
    if (nameArea) nameObserver.observe(nameArea)
    controls.current = { draw, restart, skip, replay }
    const onScroll = () => {
      // A scroll changes the content beneath a gesture; do not finish a stale drag.
      if (dragStart || touchStart) cancel()
      else if (settings.current.paused || settings.current.reducedMotion) draw()
    }
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('blur', cancel)
    window.addEventListener('dblclick', doubleClick)
    document.addEventListener('visibilitychange', restart)
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(replayFrame)
      nameObserver.disconnect()
      window.removeEventListener('resize', resize); window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('blur', cancel); window.removeEventListener('dblclick', doubleClick)
      document.removeEventListener('visibilitychange', restart)
    }
  }, [playIntro, onIntroActiveChange, onMuseFormed])

  useEffect(() => {
    settings.current = { paused, selecting, reducedMotion }
    if (!selecting) state.current.selection = undefined
    if (reducedMotion) stepParticles(state.current.particles, 0, 0, innerWidth, innerHeight, undefined, true)
    if (reducedMotion) controls.current.skip()
    const surface = document.querySelector<HTMLElement>('.portfolio-app')
    if (surface) surface.style.touchAction = selecting ? 'none' : ''
    controls.current.draw()
    controls.current.restart()
    return () => { if (surface) surface.style.touchAction = '' }
  }, [paused, selecting, reducedMotion])

  const release = (all: boolean) => {
    if (all) releaseAll(state.current.particles)
    else releaseSelected(state.current.particles, state.current.selected)
    state.current.selected.clear()
    setSelectedCount(0)
    setFrozenCount(state.current.particles.filter((particle) => particle.frozen).length)
    controls.current.draw()
  }

  return <>
    <canvas ref={canvasRef} className={`particle-canvas${introActive ? ' is-intro' : ''}`} aria-hidden="true" hidden={!canvasAvailable} />
    {introActive && <div className="intro-controls"><button type="button" onClick={() => controls.current.skip()}>Skip intro</button></div>}
    {selecting && <div data-particle-surface className="selection-surface" aria-hidden="true" />}
    <details className="particle-controls" data-content hidden={!canvasAvailable}>
      <summary>Particle controls <span aria-hidden="true">+</span></summary>
      <div className="control-body">
        <p>Click to freeze. Double-click to release. Drag empty space to select. On touch, tap to toggle or enable region selection.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? 'Resume motion' : 'Pause motion'}</button>
          <button type="button" onClick={() => setSelecting(!selecting)} aria-pressed={selecting}>{selecting ? 'Cancel selection' : 'Select region'}</button>
          <button type="button" onClick={() => release(false)} disabled={selectedCount === 0}>Release selection</button>
          <button type="button" onClick={() => release(true)} disabled={frozenCount === 0}>Release all</button>
          {playIntro && <button type="button" onClick={() => controls.current.replay()} disabled={reducedMotion}>Replay intro</button>}
        </div>
        {selecting && <div>
          <p>Keyboard: move the rectangle with arrows; hold Shift to resize.</p>
          <div className="keyboard-selection" tabIndex={0} role="group" aria-label="Selection rectangle. Arrow keys move; Shift and arrows resize." onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
            event.preventDefault()
            const dx = event.key === 'ArrowRight' ? 15 : event.key === 'ArrowLeft' ? -15 : 0
            const dy = event.key === 'ArrowDown' ? 15 : event.key === 'ArrowUp' ? -15 : 0
            const rect = keyboardRect
            const updated = event.shiftKey ? { ...rect, right: Math.max(rect.left + 15, Math.min(window.innerWidth, rect.right + dx)), bottom: Math.max(rect.top + 15, Math.min(window.innerHeight, rect.bottom + dy)) } : { left: Math.max(0, Math.min(window.innerWidth - (rect.right - rect.left), rect.left + dx)), top: Math.max(0, Math.min(window.innerHeight - (rect.bottom - rect.top), rect.top + dy)), right: 0, bottom: 0 }
            if (!event.shiftKey) { updated.right = updated.left + rect.right - rect.left; updated.bottom = updated.top + rect.bottom - rect.top }
            setKeyboardRect(updated); state.current.selection = updated; controls.current.draw()
          }}>Adjust selection rectangle</div>
          <button type="button" onClick={() => {
            state.current.selected = freezeRegion(state.current.particles, keyboardRect)
            state.current.selection = undefined
            setSelectedCount(state.current.selected.size)
            setFrozenCount(state.current.particles.filter((particle) => particle.frozen).length)
            controls.current.draw()
          }}>Freeze rectangle</button>
          <button type="button" onClick={() => {
            for (const particle of state.current.particles) if (containsPoint(keyboardRect, particle)) releaseParticle(particle)
            setFrozenCount(state.current.particles.filter((particle) => particle.frozen).length)
            controls.current.draw()
          }}>Release rectangle</button>
        </div>}
        <p role="status">{frozenCount} frozen · {selectedCount} selected{reducedMotion ? ' · Reduced motion enabled' : ''}</p>
      </div>
    </details>
  </>
}
