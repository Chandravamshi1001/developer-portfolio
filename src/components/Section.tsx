import type { ReactNode } from 'react'
import type { SectionId } from '../content/portfolio'
export function Section({ id, number, label, children }: { id: SectionId; number: string; label: string; children: ReactNode }) {
  return <section id={id} tabIndex={-1} aria-labelledby={`${id}-heading`} className={`portfolio-section section-${id}`} data-particle-surface><div className="section-content"><p className="section-eyebrow" data-content><span>{number}</span> / {label}</p>{children}</div></section>
}
