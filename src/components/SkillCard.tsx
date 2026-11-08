import type { Skill } from '../content/skills'

export function SkillIcon({ icon, name }: { icon: Skill['icon']; name?: string }) {
  const marks: Record<string, string> = { Java: 'Jv', Python: 'Py', 'C++': 'C+', JavaScript: 'JS', TypeScript: 'TS', 'Spring Boot': 'SB', 'Django REST': 'Dj', 'REST APIs': '{}', Microservices: 'Ms', PostgreSQL: 'Pg', RabbitMQ: 'Rq', Kubernetes: 'K8', 'GitHub Actions': 'GA', 'CI/CD': 'CI', 'Unit Testing': 'UT', 'Integration Testing': 'IT', 'End-to-End Testing': 'E2', 'Codex CLI': '>_', 'Claude Code': 'Cc', ChatGPT: 'GPT', 'AI Agents': 'AA', React: 'Re' }
  if (name) return <svg className="skill-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="4" fill="none" stroke="currentColor" opacity=".45" /><text x="12" y="15.5" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="currentColor">{marks[name] ?? name.slice(0, 3)}</text></svg>
  const paths = { code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-16-2 20', server: 'M3 3h18v7H3zM3 14h18v7H3zM6 6h1m-1 11h1', cloud: 'M6 18a5 5 0 0 1-1-10 7 7 0 0 1 13-1 5.5 5.5 0 0 1 0 11Z', check: 'M4 12l5 5L21 5', spark: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z', window: 'M3 4h18v16H3zM3 9h18M7 6h1' }
  return <svg className="skill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[icon]} /></svg>
}
export function SkillCard({ skill, selected, onSelect }: { skill: Skill; selected: boolean; onSelect: (skill: Skill) => void }) {
  return <button type="button" className="skill-card" data-skill-id={skill.id} aria-pressed={selected} aria-controls="skill-detail" onClick={() => onSelect(skill)}><SkillIcon icon={skill.icon} name={skill.name} /><span>{skill.name}</span></button>
}
