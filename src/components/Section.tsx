import type { ReactNode } from 'react'
import { portfolio, type SectionId } from '../content/portfolio'
export function Section({ id, label, active, children }: { id: SectionId; label: string; active: SectionId; children: ReactNode }) {
  const number = String(portfolio.sections.findIndex((section) => section.id === id) + 1).padStart(2, '0')
  return <section id={id} tabIndex={-1} aria-labelledby={`${id}-heading`} className={`portfolio-section section-${id}${active === id ? ' is-active' : ''}`} data-particle-surface><div className="section-content"><p className="section-eyebrow" data-content><span>{number}</span> / {label}</p>{children}</div></section>
}
