import { useLayoutEffect, useRef, useState } from 'react'
import { skills, skillCategories, type Skill } from '../content/skills'
import { SkillCard } from './SkillCard'
import { SkillDetail } from './SkillDetail'
import './SkillsExplorer.css'

export function SkillsExplorer() {
  const [selected, setSelected] = useState<Skill>()
  const regionRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const region = regionRef.current
    if (!region) return
    const measure = () => region.style.setProperty('--skills-panel-height', `${Math.max(0, region.clientHeight - 37)}px`)
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(region)
    return () => observer.disconnect()
  }, [])
  useLayoutEffect(() => {
    // Selection changes column overflow, which does not resize the column box.
    document.dispatchEvent(new CustomEvent('portfolio:content-change'))
  }, [selected])
  return <div ref={regionRef} className="section-scroll skills-explorer" role="region" aria-labelledby="skills-heading" data-content>
    <p className="sr-only" role="status" aria-live="polite">{selected ? `${selected.name} selected. Proficiency ${selected.proficiency.value} out of 5, owner-approved self-assessment.` : 'Select a skill to explore its experience.'}</p>
    {skillCategories.map(category => <div className="skill-category-block" key={category}>
      <article className="skill-group"><h3>{category}</h3><div className="skill-buttons">{skills.filter(skill => skill.category === category).map(skill => <SkillCard key={skill.id} skill={skill} selected={selected?.id === skill.id} onSelect={setSelected} />)}</div></article>
      {selected?.category === category && <SkillDetail skill={selected} />}
    </div>)}
    {!selected && <SkillDetail />}
  </div>
}
