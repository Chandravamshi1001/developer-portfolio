import type { Education, Experience, Project, Skills } from '../content/portfolio'

export function ExperienceCard({ experience }: { experience: Experience }) {
  return <article className="resume-card">
    <div className="card-heading"><h3>{experience.company}</h3><span className="card-meta">{experience.dates}</span></div>
    <p className="card-role">{experience.role} <span>· {experience.location}</span></p>
    <p className="card-summary">{experience.summary}</p>
    <details className="card-details"><summary>Engineering contributions</summary><ul>{experience.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul></details>
  </article>
}

export function ProjectCard({ project }: { project: Project }) {
  return <article className="resume-card">
    <div className="card-heading"><h3>{project.name}</h3>{project.status && <span className="project-status">{project.status}</span>}</div>
    <p className="card-summary">{project.summary}</p>
    <ul className="tag-list" aria-label={`${project.name} technologies`}>{project.technologies.map((technology) => <li key={technology}>{technology}</li>)}</ul>
    <details className="card-details"><summary>Implementation details</summary>{project.details.map((detail) => <p key={detail}>{detail}</p>)}</details>
  </article>
}

export function SkillGroup({ group }: { group: Skills }) {
  return <article className="skill-group"><h3>{group.category}</h3><ul className="tag-list">{group.items.map((skill) => <li key={skill}>{skill}</li>)}</ul></article>
}

export function EducationCard({ education }: { education: Education }) {
  return <article className="resume-card education-card"><span className="tiny-label">{education.graduation}</span><h3>{education.institution}</h3><p className="card-role">{education.qualification}</p><p className="education-gpa">GPA <strong>{education.gpa}</strong></p><h4>Selected coursework</h4><ul className="coursework-list">{education.coursework.map((course) => <li key={course}>{course}</li>)}</ul></article>
}
