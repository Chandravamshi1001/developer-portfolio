export const skillCategories = ['Languages', 'Backend & Distributed Systems', 'Cloud & DevOps', 'Testing', 'AI Tools & Engineering', 'Frontend'] as const
export type SkillCategory = typeof skillCategories[number]
export type EvidenceType = 'professional' | 'project' | 'professional-and-project' | 'knowledge'
export type ProficiencyValue = 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5
export interface SkillEvidence { referenceId: string; summary: string; provenance: 'implementation' | 'stack-only' | 'in-development' }
export interface Skill {
  id: string
  name: string
  category: SkillCategory
  proficiency: { value: ProficiencyValue; approval: 'owner-approved'; source: 'self-assessment' }
  evidenceType: EvidenceType
  experienceReferences: readonly SkillEvidence[]
  projectReferences: readonly SkillEvidence[]
  description: string
  evidenceSummary: string
  icon: 'code' | 'server' | 'cloud' | 'check' | 'spark' | 'window'
}
export const skillEvidenceReferences: Record<string, { id: string; title: string; kind: 'professional' | 'project'; status?: 'In development' }> = {
  metlife: { id: 'metlife', title: 'MetLife', kind: 'professional' },
  hcl: { id: 'hcl', title: 'HCL Tech', kind: 'professional' },
  erp: { id: 'erp', title: 'Distributed ERP System', kind: 'project' },
  marketplace: { id: 'marketplace', title: 'Campus Marketplace Platform', kind: 'project' },
  enhancer: { id: 'enhancer', title: 'Multi-Agent Prompt Enhancer', kind: 'project', status: 'In development' },
}
const evidence = (referenceId: string, summary: string, provenance: SkillEvidence['provenance'] = 'implementation'): SkillEvidence => ({ referenceId, summary, provenance })
const p = (summary: string) => evidence('metlife', summary)
const h = (summary: string) => evidence('hcl', summary)
const erp = (summary: string) => evidence('erp', summary)
const market = (summary: string, stack = false) => evidence('marketplace', summary, stack ? 'stack-only' : 'implementation')
const enhancer = (summary: string, stack = false) => evidence('enhancer', summary, stack ? 'stack-only' : 'in-development')
export const knowledgeExplanation = 'The resume lists this skill but does not document a specific implementation.'
const icons: Record<SkillCategory, Skill['icon']> = { Languages: 'code', 'Backend & Distributed Systems': 'server', 'Cloud & DevOps': 'cloud', Testing: 'check', 'AI Tools & Engineering': 'spark', Frontend: 'window' }
function skill(name: string, category: SkillCategory, value: ProficiencyValue, description: string, refs: readonly SkillEvidence[] = []): Skill {
  const experienceReferences = refs.filter(ref => skillEvidenceReferences[ref.referenceId].kind === 'professional')
  const projectReferences = refs.filter(ref => skillEvidenceReferences[ref.referenceId].kind === 'project')
  return { id: name.toLowerCase().replace(/\+\+/g, 'pp').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), name, category, proficiency: { value, approval: 'owner-approved', source: 'self-assessment' }, evidenceType: experienceReferences.length ? projectReferences.length ? 'professional-and-project' : 'professional' : projectReferences.length ? 'project' : 'knowledge', experienceReferences, projectReferences, description, evidenceSummary: refs.length ? refs.map(ref => ref.summary).join(' ') : knowledgeExplanation, icon: icons[category] }
}
const languages = skillCategories[0], backend = skillCategories[1], cloud = skillCategories[2], testing = skillCategories[3], ai = skillCategories[4], frontend = skillCategories[5]
export const skills: readonly Skill[] = [
  skill('Java', languages, 4, 'Backend services and event-driven processing.', [p('Backend policy-processing services and REST APIs.'), h('Enterprise document-processing components.'), erp('Java in the event-driven inventory-processing stack.')]),
  skill('Python', languages, 4, 'Backend APIs and agent-assisted workflows.', [market('Backend APIs, authentication, access control, messaging, offers, reviews, and moderation using Python/Django REST.'), enhancer('Python in the enhancement, validation, and feedback stack; under development.')]),
  skill('C++', languages, 2, 'Knowledge / Familiarity.'),
  skill('JavaScript', languages, 2, 'Knowledge / Familiarity.'),
  skill('TypeScript', languages, 2, 'Knowledge / Familiarity.'),
  skill('SQL', languages, 4, 'Transactional data access and query optimization.', [p('PostgreSQL query optimization reduced API latency from 400 ms to under 100 ms.'), h('MySQL query/index optimization on 2M+ metadata rows.'), erp('Transactional SQL within inventory processing.')]),
  skill('Spring Boot', backend, 4, 'Backend application services.', [p('Backend policy-processing services and REST APIs.'), erp('Spring Boot in the event-driven inventory-processing stack.')]),
  skill('Django REST', backend, 4, 'Backend APIs and marketplace workflows.', [market('Backend APIs, JWT authentication, RBAC, messaging, offers, reviews, and moderation. Backend ownership only.')]),
  skill('REST APIs', backend, 4, 'Service interfaces and integrations.', [p('Backend policy-processing APIs.'), h('REST integrations for operations specialists.'), market('Backend APIs for the documented marketplace workflows.')]),
  skill('Microservices', backend, 2, 'Knowledge / Familiarity; modular services alone do not establish a microservices implementation.'),
  skill('Kafka', backend, 4, 'Event-driven processing.', [p('Workflows handling 20,000+ daily policy updates.'), erp('Event-driven inventory processing.')]),
  skill('RabbitMQ', backend, 3.5, 'Asynchronous processing.', [h('Asynchronous document-processing workflows.')]),
  skill('Redis', backend, 2, 'Knowledge / Familiarity.'),
  skill('PostgreSQL', backend, 4, 'Relational data and query optimization.', [p('Query optimization reduced API latency from 400 ms to under 100 ms.'), market('Listed in the backend project stack; particular database work or performance results are not isolated.', true)]),
  skill('MySQL', backend, 4, 'Relational data and inventory processing.', [h('Query and index optimization on 2M+ metadata rows.'), erp('MySQL in the event-driven inventory-processing stack.')]),
  skill('AWS', cloud, 4.5, 'Cloud deployment stack.', [evidence('erp', 'AWS is listed in the inventory and deployment stack. No individual AWS service or professional cloud ownership is specified.', 'stack-only')]),
  skill('Docker', cloud, 4.5, 'Containerized deployment.', [erp('Containerized deployment of inventory-processing services.')]),
  skill('Kubernetes', cloud, 2, 'Knowledge / Familiarity.'),
  skill('Git', cloud, 5, 'Development version control.', [enhancer('Git is listed in the development stack; no particular branching or collaboration achievement is documented.')]),
  skill('GitHub', cloud, 2, 'Knowledge / Familiarity; a profile link does not establish a project workflow.'),
  skill('Jenkins', cloud, 3, 'Continuous integration.', [p('CI/CD integration with automated testing.')]),
  skill('GitHub Actions', cloud, 2, 'Knowledge / Familiarity.'),
  skill('CI/CD', cloud, 3.5, 'Automated integration workflows.', [p('Jenkins CI/CD integration with automated testing.')]),
  skill('Linux', cloud, 2, 'Knowledge / Familiarity.'),
  skill('Splunk', cloud, 3, 'Production troubleshooting.', [p('Used Splunk alongside metrics and distributed tracing for production troubleshooting.')]),
  skill('JUnit', testing, 4, 'Automated Java testing.', [p('Automated tests with JUnit and Mockito maintained 90%+ coverage; coverage belongs to the combined effort.')]),
  skill('Mockito', testing, 4, 'Automated test doubles.', [p('Automated tests with JUnit and Mockito maintained 90%+ coverage; coverage belongs to the combined effort.')]),
  skill('Cypress', testing, 3.5, 'Project-stack familiarity.', [market('Listed in the project stack. Which tests the owner wrote and frontend testing ownership are not documented.', true)]),
  skill('Unit Testing', testing, 3.5, 'Automated testing practices.', [p('Automated testing using JUnit and Mockito with 90%+ coverage; not a separately measured unit-only coverage figure.')]),
  skill('Integration Testing', testing, 2, 'Knowledge / Familiarity; REST integrations do not establish integration-test implementation.'),
  skill('End-to-End Testing', testing, 2, 'Knowledge / Familiarity; Cypress stack usage does not establish specific test ownership.'),
  skill('Codex CLI', ai, 4, 'Agent-assisted development tooling.', [enhancer('Tool in the prompt enhancement, validation, and feedback stack; under development.')]),
  skill('Claude Code', ai, 2, 'Knowledge / Familiarity.'),
  skill('Cursor', ai, 2, 'Knowledge / Familiarity.'),
  skill('Gemini', ai, 2, 'Knowledge / Familiarity.'),
  skill('ChatGPT', ai, 2, 'Knowledge / Familiarity.'),
  skill('NLP', ai, 2.5, 'Language-oriented prompt workflows.', [enhancer('Listed in the prompt enhancement and validation stack; no specific algorithm or evaluation result documented.')]),
  skill('LLMs', ai, 4, 'Language-model-assisted workflows.', [enhancer('LLMs in enhancement, validation, and feedback workflows; no model training or production deployment claim.')]),
  skill('AI Agents', ai, 4, 'Coordinated agent workflows.', [enhancer('Planner, enhancer, reviewer, and evaluator workflows for prompt enhancement, validation, and feedback; under development.')]),
  skill('RAG', ai, 3, 'Retrieval-augmented generation stack.', [enhancer('RAG is listed in the development stack; no completed retrieval implementation, vector database, or retrieval performance result is described.', true)]),
  skill('React', frontend, 2.5, 'Project-stack familiarity.', [market('Part of the team project stack. The owner documented backend ownership; no frontend ownership or specific React components claimed.', true)]),
]
export function getProficiencyLabel(value: number): string {
  const labels = ['Not yet familiar', 'Basic familiarity', 'Foundational knowledge', 'Comfortable with common tasks', 'Strong practical experience', 'Advanced expertise']
  return Number.isInteger(value) ? labels[value] ?? 'Self-assessment' : `Between ${labels[Math.floor(value)].toLowerCase()} and ${labels[Math.ceil(value)].toLowerCase()}`
}
