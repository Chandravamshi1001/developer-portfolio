import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { getProficiencyLabel, knowledgeExplanation, skillEvidenceReferences, type Skill, type SkillEvidence } from '../content/skills'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { SkillIcon } from './SkillCard'

function Evidence({ title, references }: { title: string; references: readonly SkillEvidence[] }) {
  if (!references.length) return null
  return <div className="skill-evidence"><h4>{title}</h4>{references.map(ref => {
    const source = skillEvidenceReferences[ref.referenceId]
    return <div key={ref.referenceId} className="skill-reference"><p className="skill-reference-name">{source.title}{source.status && <span className="skill-provenance">{source.status}</span>}{ref.provenance === 'stack-only' && <span className="skill-provenance">Stack evidence only</span>}</p><p>{ref.summary}</p></div>
  })}</div>
}
export function SkillDetail({ skill }: { skill?: Skill }) {
  const panelRef = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0
  }, [skill?.id])
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [filledId, setFilledId] = useState<string>()
  useEffect(() => {
    if (!skill || reducedMotion) return
    const frame = requestAnimationFrame(() => setFilledId(skill.id))
    return () => cancelAnimationFrame(frame)
  }, [skill, reducedMotion])
  return <section ref={panelRef} id="skill-detail" className="skill-detail" aria-labelledby="skill-detail-heading" tabIndex={0} data-selected-skill={skill?.id}>
    {skill ? <>
      <div className="skill-detail-title"><SkillIcon icon={skill.icon} name={skill.name} /><h3 id="skill-detail-heading">{skill.name}</h3><span>{skill.proficiency.value}/5</span></div>
      <p className="skill-assessment">Owner-approved self-assessment</p>
      <div role="meter" aria-label={`${skill.name} proficiency`} aria-valuemin={0} aria-valuemax={5} aria-valuenow={skill.proficiency.value} aria-valuetext={`${skill.proficiency.value} out of 5. ${getProficiencyLabel(skill.proficiency.value)}. Self-assessment.`} className="skill-confidence"><span className="skill-confidence-fill" style={{ '--skill-fill': reducedMotion || filledId === skill.id ? skill.proficiency.value / 5 : 0 } as CSSProperties} /></div>
      <p className="skill-scale">{getProficiencyLabel(skill.proficiency.value)}</p>
      <p className="skill-description">{skill.description}</p>
      {skill.evidenceType === 'knowledge' ? <div className="skill-evidence"><h4>Knowledge / Familiarity</h4><p>{knowledgeExplanation}</p></div> : <><Evidence title="Professional experience" references={skill.experienceReferences} /><Evidence title="Projects" references={skill.projectReferences} /></>}
    </> : <><h3 id="skill-detail-heading">Explore the toolkit</h3><p>Select a skill to see its self-assessed proficiency and the experience behind it.</p></>}
  </section>
}
