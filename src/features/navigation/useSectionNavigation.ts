import { useEffect, useRef, useState } from 'react'
import { portfolio, type SectionId } from '../../content/portfolio'
import { useMediaQuery } from '../../hooks/useMediaQuery'

export function useSectionNavigation() {
  const trackRef = useRef<HTMLDivElement>(null)
  const shellRef = useRef<HTMLElement>(null)
  const programmaticFocus = useRef(false)
  const [horizontal, setHorizontal] = useState(false)
  const [active, setActive] = useState<SectionId>('home')
  const desktop = useMediaQuery('(min-width: 1000px) and (min-height: 700px) and (pointer: fine)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  useEffect(() => {
    let frame = 0
    const measure = () => {
      const contents = trackRef.current?.querySelectorAll<HTMLElement>('.section-content')
      const fits = contents ? Array.from(contents).every((content) => {
        const section = content.closest<HTMLElement>('.portfolio-section')
        if (!section) return false
        const styles = getComputedStyle(section)
        const padding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom)
        return content.scrollHeight + padding <= window.innerHeight
      }) : false
      setHorizontal(desktop && !reducedMotion && fits)
    }
    const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure) })
    if (trackRef.current) observer.observe(trackRef.current)
    trackRef.current?.querySelectorAll('.section-content').forEach((content) => observer.observe(content))
    window.addEventListener('resize', measure); measure()
    void document.fonts?.ready.then(measure)
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('resize', measure) }
  }, [desktop, reducedMotion])
  useEffect(() => {
    let frame = 0
    const update = () => {
      if (horizontal && trackRef.current) {
        const progress = Math.max(0, Math.min(5, (window.scrollY - (shellRef.current?.offsetTop ?? 0)) / window.innerHeight))
        trackRef.current.style.transform = `translate3d(${-progress * window.innerWidth}px,0,0)`
        setActive(portfolio.sections[Math.round(progress)].id)
      } else {
        if (trackRef.current) trackRef.current.style.transform = ''
        let closest: SectionId = 'home'
        for (const section of portfolio.sections) if ((document.getElementById(section.id)?.getBoundingClientRect().top ?? Infinity) <= window.innerHeight * .4) closest = section.id
        setActive(closest)
      }
    }
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update) }
    const hash = () => {
      const id = location.hash.slice(1)
      const index = portfolio.sections.findIndex((section) => section.id === id)
      if (index < 0) return
      if (horizontal) window.scrollTo({ top: (shellRef.current?.offsetTop ?? 0) + index * innerHeight, behavior: 'instant' })
      else document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
      update()
    }
    const focus = (event: FocusEvent) => {
      if (programmaticFocus.current || !horizontal || !(event.target instanceof Element)) return
      const section = event.target.closest('.portfolio-section')
      if (!section) return
      const index = portfolio.sections.findIndex((entry) => entry.id === section.id)
      window.scrollTo({ top: (shellRef.current?.offsetTop ?? 0) + index * innerHeight, behavior: 'instant' }); update()
    }
    window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('hashchange', hash); document.addEventListener('focusin', focus)
    hash(); update()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); window.removeEventListener('hashchange', hash); document.removeEventListener('focusin', focus) }
  }, [horizontal])
  const navigate = (id: SectionId) => {
    const index = portfolio.sections.findIndex((section) => section.id === id)
    history.pushState(null, '', `#${id}`)
    const target = document.getElementById(id)
    programmaticFocus.current = true
    target?.focus({ preventScroll: true })
    programmaticFocus.current = false
    if (horizontal) window.scrollTo({ top: (shellRef.current?.offsetTop ?? 0) + index * innerHeight, behavior: reducedMotion ? 'instant' : 'smooth' })
    else target?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth' })
  }
  return { trackRef, shellRef, horizontal, active, navigate }
}
