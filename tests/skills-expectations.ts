// Independent acceptance values: approved proposal plus the owner's explicit overrides.
export const approvedSkillRatings: Readonly<Record<string, number>> = {
  Java: 4, Python: 4, 'C++': 2, JavaScript: 2, TypeScript: 2, SQL: 4,
  'Spring Boot': 4, 'Django REST': 4, 'REST APIs': 4, Microservices: 2,
  Kafka: 4, RabbitMQ: 3.5, Redis: 2, PostgreSQL: 4, MySQL: 4,
  AWS: 4.5, Docker: 4.5, Kubernetes: 2, Git: 5, GitHub: 2, Jenkins: 3,
  'GitHub Actions': 2, 'CI/CD': 3.5, Linux: 2, Splunk: 3,
  JUnit: 4, Mockito: 4, Cypress: 3.5, 'Unit Testing': 3.5,
  'Integration Testing': 2, 'End-to-End Testing': 2,
  'Codex CLI': 4, 'Claude Code': 2, Cursor: 2, Gemini: 2, ChatGPT: 2,
  NLP: 2.5, LLMs: 4, 'AI Agents': 4, RAG: 3, React: 2.5,
}

export const knowledgeOnlySkills = [
  'C++', 'JavaScript', 'TypeScript', 'Microservices', 'Redis', 'Kubernetes',
  'GitHub', 'GitHub Actions', 'Linux', 'Integration Testing', 'End-to-End Testing',
  'Claude Code', 'Cursor', 'Gemini', 'ChatGPT',
] as const

export const expectedProfessionalSkills = [
  'Java', 'SQL', 'Spring Boot', 'REST APIs', 'Kafka', 'RabbitMQ', 'PostgreSQL',
  'MySQL', 'Jenkins', 'CI/CD', 'Splunk', 'JUnit', 'Mockito', 'Unit Testing',
] as const

export const expectedProjectSkills = [
  'Java', 'Python', 'SQL', 'Spring Boot', 'Django REST', 'REST APIs', 'Kafka',
  'PostgreSQL', 'MySQL', 'AWS', 'Docker', 'Git', 'Cypress', 'Codex CLI', 'NLP',
  'LLMs', 'AI Agents', 'RAG', 'React',
] as const
