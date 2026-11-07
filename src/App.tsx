import { SiteHeader } from './components/SiteHeader'
import { PortfolioSections } from './components/PortfolioSections'
import { ParticleField } from './features/particles/ParticleField'
import { useSectionNavigation } from './features/navigation/useSectionNavigation'
export default function App() {
  const { shellRef, trackRef, horizontal, active, navigate } = useSectionNavigation()
  return <div className="portfolio-app" data-particle-surface>
    <a href="#home" className="skip-link" onClick={(event) => { event.preventDefault(); navigate('home') }}>Skip to main content</a>
    <SiteHeader active={active} navigate={navigate} />
    <main ref={shellRef} className={horizontal ? 'section-shell is-horizontal' : 'section-shell'} aria-label="Portfolio">
      <div className="section-viewport"><div ref={trackRef} className="section-track"><PortfolioSections navigate={navigate} /></div></div>
    </main>
    <ParticleField />
    <div className="section-progress" aria-hidden="true"><span>0{['home', 'about', 'projects', 'skills', 'education', 'contact'].indexOf(active) + 1}</span><div /><span>06</span></div>
  </div>
}
