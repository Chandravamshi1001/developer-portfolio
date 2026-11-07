import { useState } from 'react'
import { portfolio, type SectionId } from '../content/portfolio'

export function SiteHeader({ active, navigate }: { active: SectionId; navigate: (id: SectionId) => void }) {
  const [open, setOpen] = useState(false)
  return <header className="site-header" data-content>
    <a className="wordmark" href="#home" onClick={(event) => { event.preventDefault(); navigate('home') }} aria-label={`${portfolio.name}, home`}>CVK<span aria-hidden="true">.</span></a>
    <button className="menu-button" type="button" aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'} <span aria-hidden="true">{open ? '−' : '+'}</span></button>
    <nav id="primary-navigation" className={open ? 'navigation is-open' : 'navigation'} aria-label="Primary">
      {portfolio.sections.map((section) => <a key={section.id} href={`#${section.id}`} aria-current={active === section.id ? 'location' : undefined} onClick={(event) => { event.preventDefault(); navigate(section.id); setOpen(false) }}>{section.label}</a>)}
    </nav>
  </header>
}
