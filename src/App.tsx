import { useCallback, useEffect, useState } from 'react'
import { SiteHeader } from './components/SiteHeader'
import { PortfolioSections } from './components/PortfolioSections'
import { PortfolioMuse, type MuseRequest } from './components/PortfolioMuse'
import { ParticleField } from './features/particles/ParticleField'
import { useSectionNavigation } from './features/navigation/useSectionNavigation'
import { portfolio, type SectionId } from './content/portfolio'
import type { MuseFormation } from './features/muse/geometry'
export default function App() {
  const [introActive, setIntroActive] = useState(true)
  const [museRequest, setMuseRequest] = useState<MuseRequest>()
  const [museFormation, setMuseFormation] = useState<MuseFormation>()
  const onMuseFormed = useCallback((formation: MuseFormation) => setMuseFormation(formation), [])
  const onIntroActiveChange = useCallback((isActive: boolean) => {
    setIntroActive(isActive)
    if (isActive) { setMuseRequest(undefined); setMuseFormation(undefined) }
  }, [])
  const { shellRef, trackRef, horizontal, active, navigate: navigateSection } = useSectionNavigation(!introActive)
  const navigate = (id: SectionId) => {
    if (introActive) return
    const difference = portfolio.sections.findIndex(section => section.id === id) - portfolio.sections.findIndex(section => section.id === active)
    setMuseRequest(previous => ({ sequence: (previous?.sequence ?? 0) + 1, direction: Math.sign(difference) as -1 | 0 | 1 }))
    navigateSection(id)
  }
  useEffect(() => {
    if (!introActive) return
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = previous }
  }, [introActive])
  return <div className="portfolio-app" data-particle-surface data-intro-active={introActive}>
    <div className="portfolio-content" inert={introActive} aria-hidden={introActive || undefined}>
    <a href="#home" className="skip-link" onClick={(event) => { event.preventDefault(); navigate('home') }}>Skip to main content</a>
    <SiteHeader active={active} navigate={navigate} />
    <main ref={shellRef} className={horizontal ? 'section-shell is-horizontal' : 'section-shell'} aria-label="Portfolio">
      <div className="section-viewport"><div ref={trackRef} className="section-track"><PortfolioSections navigate={navigate} active={active} /></div></div>
    </main>
    </div>
    <div className="portfolio-dock">
      <div className="section-progress" aria-hidden="true"><span>{String(portfolio.sections.findIndex((section) => section.id === active) + 1).padStart(2, '0')}</span><div /><span>{String(portfolio.sections.length).padStart(2, '0')}</span></div>
      <div className="muse-anchor muse-placement" data-muse-anchor aria-hidden="true" />
      {!introActive && <PortfolioMuse request={museRequest} formation={museFormation} />}
    </div>
    <ParticleField playIntro onIntroActiveChange={onIntroActiveChange} onMuseFormed={onMuseFormed} />
  </div>
}
