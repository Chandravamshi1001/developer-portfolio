import { describe, expect, it } from 'vitest'
import { skills, skillCategories, skillEvidenceReferences } from '../src/content/skills'
import { approvedSkillRatings, expectedProfessionalSkills, expectedProjectSkills, knowledgeOnlySkills } from './skills-expectations'

describe('owner-approved Skills Explorer content', () => {
  it('contains exactly the 41 approved technologies and their exact self-assessments', () => {
    expect(skills).toHaveLength(41)
    expect(new Set(skills.map(skill => skill.id)).size).toBe(41)
    expect(skills.map(skill => skill.name).sort()).toEqual(Object.keys(approvedSkillRatings).sort())
    expect(skillCategories).toHaveLength(6)
    for (const skill of skills) {
      expect(skill.proficiency).toEqual({ value: approvedSkillRatings[skill.name], approval: 'owner-approved', source: 'self-assessment' })
      expect(skill.proficiency.value).toBeGreaterThanOrEqual(0)
      expect(skill.proficiency.value).toBeLessThanOrEqual(5)
      expect(Number.isInteger(skill.proficiency.value * 2)).toBe(true)
      expect(skill.description.trim().length).toBeGreaterThan(0)
      expect(skill.evidenceSummary.trim().length).toBeGreaterThan(0)
    }
  })

  it('preserves the separately approved professional, project, and knowledge-only evidence boundaries', () => {
    expect(skills.filter(skill => skill.experienceReferences.length).map(skill => skill.name).sort()).toEqual([...expectedProfessionalSkills].sort())
    expect(skills.filter(skill => skill.projectReferences.length).map(skill => skill.name).sort()).toEqual([...expectedProjectSkills].sort())
    expect(skills.filter(skill => skill.evidenceType === 'knowledge').map(skill => skill.name).sort()).toEqual([...knowledgeOnlySkills].sort())
    for (const skill of skills) {
      if (knowledgeOnlySkills.some(name => name === skill.name)) {
        expect(skill.experienceReferences).toHaveLength(0)
        expect(skill.projectReferences).toHaveLength(0)
      }
      for (const [references, kind] of [[skill.experienceReferences, 'professional'], [skill.projectReferences, 'project']] as const) {
        for (const reference of references) {
          expect(skillEvidenceReferences[reference.referenceId]?.kind).toBe(kind)
          expect(reference.summary.trim().length).toBeGreaterThan(0)
          expect(['implementation', 'stack-only', 'in-development']).toContain(reference.provenance)
        }
      }
    }
  })

  it('keeps React and Cypress as team-stack evidence and all seven Enhancer mappings under development', () => {
    for (const name of ['React', 'Cypress']) {
      const skill = skills.find(skill => skill.name === name)!
      expect(skill.experienceReferences).toHaveLength(0)
      expect(skill.projectReferences).toHaveLength(1)
      expect(skill.projectReferences[0].provenance).toBe('stack-only')
      expect(skillEvidenceReferences[skill.projectReferences[0].referenceId].title).toMatch(/Campus Marketplace/)
    }
    const enhancerNames: string[] = []
    for (const skill of skills) for (const reference of skill.projectReferences) {
      if (/Prompt Enhancer/.test(skillEvidenceReferences[reference.referenceId].title)) {
        enhancerNames.push(skill.name)
        expect(reference.provenance).toBe(skill.name === 'RAG' ? 'stack-only' : 'in-development')
        expect(skillEvidenceReferences[reference.referenceId].status).toBe('In development')
      }
    }
    expect(enhancerNames.sort()).toEqual(['Python', 'Git', 'Codex CLI', 'NLP', 'LLMs', 'AI Agents', 'RAG'].sort())
  })
})
