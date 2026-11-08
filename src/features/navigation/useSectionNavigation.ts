import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { portfolio, type SectionId } from '../../content/portfolio'
import { useMediaQuery } from '../../hooks/useMediaQuery'

gsap.registerPlugin(ScrollTrigger)

const sectionId = (hash: string) => portfolio.sections.find(({ id }) => `#${id}` === hash)?.id
const historyKey = '__portfolioNavigation'
interface ScrollPosition { id: SectionId; fraction: number; hash: string }

function savedPosition(state: unknown): ScrollPosition | undefined {
  if (!state || typeof state !== 'object' || !(historyKey in state)) return
  const saved = (state as Record<string, unknown>)[historyKey] as Partial<ScrollPosition> | undefined
  if (saved && saved.hash === location.hash && portfolio.sections.some(({ id }) => id === saved.id)
    && typeof saved.fraction === 'number' && Number.isFinite(saved.fraction)) return saved as ScrollPosition
}

export function useSectionNavigation(enabled = true) {
  const trackRef = useRef<HTMLDivElement>(null)
  const shellRef = useRef<HTMLElement>(null)
  const programmaticFocus = useRef(false)
  const initialized = useRef(false)
  const currentSection = useRef<SectionId>('home')
  const moveTo = useRef<(id: SectionId, behavior: ScrollBehavior) => void>(() => {})
  const recordPosition = useRef<() => void>(() => {})
  const [active, setActive] = useState<SectionId>('home')
  const desktop = useMediaQuery('(min-width: 1000px) and (min-height: 560px) and (pointer: fine)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const horizontal = desktop && !reducedMotion

  useLayoutEffect(() => {
    if (!enabled) {
      moveTo.current = () => {}
      recordPosition.current = () => {}
      return
    }
    const shell = shellRef.current
    const track = trackRef.current
    if (!shell || !track) return
    const viewport = track.parentElement!
    const panels = Array.from(track.querySelectorAll<HTMLElement>('.portfolio-section'))
    const previousRestoration = history.scrollRestoration
    history.scrollRestoration = 'manual'
    let disposed = false
    let frame = 0
    let fragmentFrame = 0
    let historyTimer: ReturnType<typeof setTimeout> | undefined
    let trigger: ScrollTrigger | undefined
    let offsets: number[] = []
    let previousTravel = 0
    let preserved: { index: number; fraction: number } | undefined
    let traversedUrl: string | undefined
    const travel = () => Math.max(0, track.scrollWidth - viewport.clientWidth)
    const activate = (index: number) => {
      const id = portfolio.sections[index]?.id ?? 'home'
      currentSection.current = id
      setActive(id)
    }
    // Columns continue into additional horizontal space instead of a nested scroller.
    // Keep the content's base width stable while allowing its containing panel to grow.
    const measurePanels = () => {
      for (const panel of panels) {
        const content = panel.querySelector<HTMLElement>('.section-content')
        if (!content) continue
        const styles = getComputedStyle(panel)
        const width = content.scrollWidth + parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight)
        panel.style.setProperty('--panel-width', `${Math.max(viewport.clientWidth, Math.ceil(width))}px`)
      }
    }
    const update = () => {
      if (trigger) {
        const x = Math.max(0, Math.min(travel(), window.scrollY - trigger.start))
        let index = 0
        for (let i = 1; i < panels.length; i++) {
          if (x >= panels[i].offsetLeft - viewport.clientWidth * .4) index = i
        }
        activate(index)
      } else {
        let index = 0
        panels.forEach((panel, i) => { if (panel.getBoundingClientRect().top <= innerHeight * .4) index = i })
        activate(index)
      }
    }
    const scrollToSection = (id: SectionId, behavior: ScrollBehavior) => {
      const panel = panels.find((entry) => entry.id === id)
      if (!panel) return
      // Native fragment/focus navigation can scroll an overflow-hidden viewport sideways.
      viewport.scrollLeft = 0
      if (trigger) window.scrollTo({ top: trigger.start + Math.min(panel.offsetLeft, travel()), behavior })
      else panel.scrollIntoView({ behavior, block: 'start' })
      ScrollTrigger.update()
      update()
    }
    const resetFragmentScroll = () => {
      // Chromium may scroll the clipped viewport after dispatching focusin.
      // Clear that native fragment scroll before the next painted frame.
      cancelAnimationFrame(fragmentFrame)
      fragmentFrame = requestAnimationFrame(() => { if (!disposed) viewport.scrollLeft = 0 })
    }
    moveTo.current = scrollToSection
    recordPosition.current = () => {
      // Keep existing object-state fields intact. Primitive state cannot carry a
      // namespace without changing its public shape, so leave that state alone.
      const state: unknown = history.state
      if (state !== null && (typeof state !== 'object' || Array.isArray(state))) return
      const starts = panels.map((panel) => trigger ? panel.offsetLeft : panel.getBoundingClientRect().top + window.scrollY)
      const position = trigger ? Math.max(0, Math.min(travel(), window.scrollY - trigger.start)) : window.scrollY
      let index = 0
      starts.forEach((start, i) => { if (start <= position + 1) index = i })
      const span = (starts[index + 1] ?? (trigger ? travel() : starts[index] + panels[index].offsetHeight)) - starts[index]
      const saved: ScrollPosition = { id: panels[index].id as SectionId, fraction: span > 0 ? (position - starts[index]) / span : 0, hash: location.hash }
      history.replaceState({ ...state, [historyKey]: saved }, '')
    }
    const initialSection = initialized.current ? currentSection.current : sectionId(location.hash)

    const context = gsap.context(() => {
      if (!horizontal) return
      measurePanels()
      const tween = gsap.to(track, {
        x: () => -travel(),
        ease: 'none',
        scrollTrigger: {
          trigger: shell,
          start: 'top top',
          end: () => `+=${travel()}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: update,
          onRefreshInit: () => {
            if (trigger && offsets.length) {
              const x = Math.max(0, Math.min(previousTravel, window.scrollY - trigger.start))
              let index = 0
              offsets.forEach((offset, i) => { if (offset <= x + 1) index = i })
              const span = (offsets[index + 1] ?? previousTravel) - offsets[index]
              preserved = { index, fraction: span > 0 ? (x - offsets[index]) / span : 0 }
            }
            measurePanels()
          },
          onRefresh: (self) => {
            const nextOffsets = panels.map((panel) => panel.offsetLeft)
            const changed = previousTravel !== travel() || offsets.some((offset, i) => offset !== nextOffsets[i])
            offsets = nextOffsets
            previousTravel = travel()
            if (preserved && changed) {
              const { index, fraction } = preserved
              const span = (offsets[index + 1] ?? previousTravel) - offsets[index]
              window.scrollTo({ top: self.start + Math.min(previousTravel, offsets[index] + fraction * span), behavior: 'instant' })
            }
            preserved = undefined
            update()
          },
        },
      })
      trigger = tween.scrollTrigger
      offsets = panels.map((panel) => panel.offsetLeft)
      previousTravel = travel()
    }, shell)

    const refresh = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (disposed) return
        const focused = document.activeElement instanceof HTMLElement && track.contains(document.activeElement) ? document.activeElement : undefined
        if (trigger) trigger.refresh()
        else update()
        // Refresh can temporarily detach the pinned track. Restore only focus
        // lost to that operation; keep deliberate focus changes untouched.
        if (focused?.isConnected && document.activeElement === document.body) {
          programmaticFocus.current = true
          focused.focus({ preventScroll: true })
          programmaticFocus.current = false
        }
      })
    }
    const saveScrollPosition = () => {
      clearTimeout(historyTimer)
      historyTimer = undefined
      recordPosition.current()
    }
    const onScroll = () => {
      if (!trigger) update()
      // Record the destination entry too, so Forward restores manual scrolling
      // after a link visit. Debounce avoids a history mutation on every frame.
      clearTimeout(historyTimer)
      historyTimer = setTimeout(saveScrollPosition, 120)
    }
    const onPopState = (event: PopStateEvent) => {
      clearTimeout(historyTimer)
      historyTimer = undefined
      traversedUrl = location.href
      const saved = savedPosition(event.state)
      const panel = saved && panels.find((entry) => entry.id === saved.id)
      if (!saved || !panel) { scrollToSection(sectionId(location.hash) ?? 'home', 'instant'); return }
      viewport.scrollLeft = 0
      const index = panels.indexOf(panel)
      const start = trigger ? panel.offsetLeft : panel.getBoundingClientRect().top + window.scrollY
      const end = trigger ? (panels[index + 1]?.offsetLeft ?? travel()) : start + panel.offsetHeight
      const offset = start + Math.max(0, Math.min(1, saved.fraction)) * (end - start)
      window.scrollTo({ top: trigger ? trigger.start + Math.min(travel(), offset) : offset, behavior: 'instant' })
      ScrollTrigger.update()
      update()
      resetFragmentScroll()
    }
    const onHashChange = () => {
      clearTimeout(historyTimer)
      historyTimer = undefined
      // A traversal may emit both events. Its stored free-scroll position wins
      // over the old hash; a newly entered fragment still navigates normally.
      const alreadyRestored = traversedUrl === location.href
      traversedUrl = undefined
      if (!alreadyRestored) scrollToSection(sectionId(location.hash) ?? 'home', 'instant')
      resetFragmentScroll()
    }
    const onFocus = (event: FocusEvent) => {
      if (!trigger || programmaticFocus.current || !(event.target instanceof HTMLElement)) return
      const panel = event.target.closest<HTMLElement>('.portfolio-section')
      if (!panel) return
      viewport.scrollLeft = 0
      if (event.target === panel) {
        // A fragment focuses the section itself. Content's reading inset is
        // appropriate for links in later columns, but would misalign an anchor.
        if (traversedUrl !== location.href || !savedPosition(history.state)) {
          scrollToSection(panel.id as SectionId, 'instant')
        }
        resetFragmentScroll()
        return
      }
      const bounds = event.target.getBoundingClientRect()
      if (bounds.left >= 0 && bounds.right <= viewport.clientWidth) return
      const left = bounds.left - track.getBoundingClientRect().left
      window.scrollTo({ top: trigger.start + Math.max(0, Math.min(travel(), left - viewport.clientWidth * .12)), behavior: 'instant' })
      ScrollTrigger.update()
      update()
    }
    const observer = new ResizeObserver(refresh)
    panels.forEach((panel) => {
      const content = panel.querySelector('.section-content')
      if (content) observer.observe(content)
    })
    // Details change column overflow without necessarily resizing the column container.
    track.addEventListener('toggle', refresh, true)
    document.addEventListener('portfolio:content-change', refresh)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scrollend', saveScrollPosition)
    window.addEventListener('popstate', onPopState)
    window.addEventListener('hashchange', onHashChange)
    document.addEventListener('focusin', onFocus)
    void document.fonts?.ready.then(() => { if (!disposed) refresh() })
    if (initialSection) scrollToSection(initialSection, 'instant')
    initialized.current = true
    update()
    recordPosition.current()
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      cancelAnimationFrame(fragmentFrame)
      clearTimeout(historyTimer)
      observer.disconnect()
      track.removeEventListener('toggle', refresh, true)
      document.removeEventListener('portfolio:content-change', refresh)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('scrollend', saveScrollPosition)
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('hashchange', onHashChange)
      document.removeEventListener('focusin', onFocus)
      history.scrollRestoration = previousRestoration
      context.revert()
      panels.forEach((panel) => panel.style.removeProperty('--panel-width'))
    }
  }, [horizontal, enabled])

  const navigate = (id: SectionId) => {
    if (!enabled) return
    if (location.hash !== `#${id}`) {
      recordPosition.current()
      history.pushState(null, '', `#${id}`)
    }
    programmaticFocus.current = true
    document.getElementById(id)?.focus({ preventScroll: true })
    programmaticFocus.current = false
    moveTo.current(id, reducedMotion ? 'instant' : 'smooth')
  }
  return { trackRef, shellRef, horizontal, active, navigate }
}
