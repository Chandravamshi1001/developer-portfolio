export interface Experience {
  company: string
  role: string
  location: string
  dates: string
  summary: string
  highlights: readonly string[]
}

export interface Project {
  name: string
  technologies: readonly string[]
  status?: string
  summary: string
  details: readonly string[]
}

export interface Skills { category: string; items: readonly string[] }
export interface Education {
  institution: string
  qualification: string
  graduation: string
  gpa: string
  coursework: readonly string[]
}

const heroTaglineLines = ['Engineering reliable systems.', 'Exploring intelligent possibilities.'] as const

export const portfolio = {
  name: 'Chandra Vamshi Katineni',
  nameLines: ['CHANDRA', 'VAMSHI'],
  location: 'Fort Wayne, Indiana, USA',
  title: 'Software Engineer | Java Backend Developer | AI & Distributed Systems Enthusiast',
  heroTitle: 'Software Engineer | Backend Systems | AI Engineering',
  heroTaglineLines,
  tagline: heroTaglineLines.join(' '),
  experienceSummary: 'Three years of backend engineering, from delivery to production.',
  email: 'katinenichandravamshi@gmail.com',
  github: 'https://github.com/Chandravamshi1001',
  linkedin: 'https://www.linkedin.com/in/chandra-vamshi-314a24260',
  resumeUrl: undefined as string | undefined,
  sections: [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
    { id: 'contact', label: 'Contact' },
  ],
  about: [
    'I’m a software engineer with three years of experience designing, building, testing, and operating backend services and distributed workflows.',
    'My work centers on Java, Spring Boot, Kafka, REST APIs, and databases, with an emphasis on reliable cloud systems, automated testing, CI/CD, and production troubleshooting.',
    'I’m currently pursuing an M.S. in Computer Science at Purdue University Fort Wayne, while exploring AI engineering, AI-assisted development, and distributed systems.',
  ],
} as const

export const experiences: readonly Experience[] = [
  {
    company: 'MetLife', role: 'Software Engineer', location: 'Bangalore, India', dates: 'December 2023 – July 2025',
    summary: 'Built and operated Spring Boot and Kafka services processing 20,000+ daily insurance policy updates.',
    highlights: [
      'Reduced API latency from 400ms to under 100ms through PostgreSQL query optimization and connection pool tuning.',
      'Implemented validation, security, exception handling, and failure recovery across 3 REST APIs.',
      'Maintained 90%+ automated test coverage using JUnit and Mockito with Jenkins CI/CD.',
      'Reduced incident investigation time by 20% using metrics, distributed tracing, and Splunk.',
    ],
  },
  {
    company: 'HCL Tech', role: 'Software Engineer', location: 'Hyderabad, India', dates: 'August 2022 – November 2023',
    summary: 'Built a modular Java document platform handling up to 5,000 documents weekly.',
    highlights: [
      'Reduced transaction time by 30% at peak load using RabbitMQ.',
      'Optimized MySQL queries and indexes for metadata spanning over 2 million rows.',
      'Delivered REST integrations supporting 20+ operations specialists.',
      'Contributed to 15% fewer deployment rollbacks through production troubleshooting.',
    ],
  },
]

export const projects: readonly Project[] = [
  {
    name: 'Multi-Agent Prompt Enhancer', status: 'In development',
    technologies: ['Python', 'NLP', 'LLMs', 'Codex CLI', 'AI Agents', 'RAG', 'Git'],
    summary: 'A multi-agent workflow for clearer prompts while preserving the user’s intent.',
    details: ['Planner, enhancer, reviewer, and evaluator agents add missing constraints, validate prompts, and incorporate user feedback.'],
  },
  {
    name: 'Distributed ERP System', technologies: ['Java', 'Spring Boot', 'Kafka', 'MySQL', 'AWS', 'Docker'],
    summary: 'An event-driven ERP system for a business with approximately $200K in revenue.',
    details: ['Modular services coordinate inventory events through Kafka, with transactional SQL, container deployment, and failure-aware processing.'],
  },
  {
    name: 'Campus Marketplace Platform', technologies: ['Python', 'Django REST', 'PostgreSQL', 'React', 'Cypress'],
    summary: 'Owned backend development in a four-person Agile team building a campus marketplace.',
    details: ['Implemented JWT and role-based access control, with workflows for listings, messaging, offers, reviews, moderation, and administration.'],
  },
]

export const skillGroups: readonly Skills[] = [
  { category: 'Languages', items: ['Java', 'Python', 'C++', 'JavaScript', 'TypeScript', 'SQL'] },
  { category: 'Backend & Distributed Systems', items: ['Spring Boot', 'Django REST', 'REST APIs', 'Microservices', 'Kafka', 'RabbitMQ', 'Redis', 'PostgreSQL', 'MySQL'] },
  { category: 'Cloud & DevOps', items: ['AWS', 'Docker', 'Kubernetes', 'Git', 'GitHub', 'Jenkins', 'GitHub Actions', 'CI/CD', 'Linux'] },
  { category: 'Testing', items: ['JUnit', 'Mockito', 'Cypress', 'Unit Testing', 'Integration Testing', 'End-to-End Testing'] },
  { category: 'AI Tools', items: ['Codex CLI', 'Claude Code', 'Cursor', 'Gemini', 'ChatGPT'] },
]

export const education: Education = {
  institution: 'Purdue University Fort Wayne', qualification: 'Master of Science in Computer Science',
  graduation: 'Expected graduation: May 2027', gpa: '4.0/4.0',
  coursework: ['Data Structures and Algorithms', 'Distributed Computing', 'Software Engineering', 'Database Systems'],
}

export type SectionId = typeof portfolio.sections[number]['id']
