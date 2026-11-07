import { education, experiences, portfolio, projects, skillGroups, type SectionId } from '../content/portfolio'
import { EducationCard, ExperienceCard, ProjectCard, SkillGroup } from './ResumeCards'
import { Section } from './Section'

export function PortfolioSections({ navigate, active }: { navigate: (id: SectionId) => void; active: SectionId }) {
  return <>
    <Section id="home" label="Software engineer" active={active}>
      <h1 id="home-heading" className="name-heading" data-particle-name><span className="sr-only">{portfolio.name}</span></h1>
      <div className="hero-copy" data-content>
        <p className="hero-role">{portfolio.heroTitle}</p>
        <p className="hero-statement">{portfolio.heroTaglineLines[0]}<br /><span>{portfolio.heroTaglineLines[1]}</span></p>
        <div className="hero-actions">
          <a className="text-link" href="#projects" onClick={(event) => { event.preventDefault(); navigate('projects') }}>View projects <span aria-hidden="true">↗</span></a>
          <a className="text-link" href="#contact" onClick={(event) => { event.preventDefault(); navigate('contact') }}>Contact Me <span aria-hidden="true">↗</span></a>
          <a className="profile-link" href={portfolio.github}>GitHub <span aria-hidden="true">↗</span></a>
          <a className="profile-link" href={portfolio.linkedin}>LinkedIn <span aria-hidden="true">↗</span></a>
          {portfolio.resumeUrl && <a className="profile-link" href={portfolio.resumeUrl} download>Download resume <span aria-hidden="true">↓</span></a>}
        </div>
      </div>
      <div className="hero-footer" data-content><span className="tiny-label">{portfolio.location}</span><span className="tiny-label scroll-hint">Scroll to explore <span aria-hidden="true">↓</span></span></div>
    </Section>

    <Section id="about" label="About" active={active}>
      <div data-content className="section-intro"><h2 id="about-heading">The person<br /><span className="muted">behind the code.</span></h2></div>
      <div className="section-scroll about-copy" role="region" aria-labelledby="about-heading" tabIndex={0} data-content>
        {portfolio.about.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <p className="about-signature">Java foundations. Distributed thinking. Intelligent possibilities.</p>
      </div>
    </Section>

    <Section id="experience" label="Experience" active={active}>
      <div data-content className="section-intro"><h2 id="experience-heading">Systems built.<br /><span className="muted">Lessons earned.</span></h2><p className="muted section-description">{portfolio.experienceSummary}</p></div>
      <div className="section-scroll" role="region" aria-labelledby="experience-heading" tabIndex={0} data-content>
        {experiences.map((experience) => <ExperienceCard key={experience.company} experience={experience} />)}
      </div>
    </Section>

    <Section id="projects" label="Selected work" active={active}>
      <div data-content className="section-intro"><h2 id="projects-heading">Ideas into<br /><span className="muted">working software.</span></h2><p className="muted section-description">Distributed services, useful tools, and an exploration of AI agents.</p></div>
      <div className="section-scroll" role="region" aria-labelledby="projects-heading" tabIndex={0} data-content>
        {projects.map((project) => <ProjectCard key={project.name} project={project} />)}
      </div>
    </Section>

    <Section id="skills" label="Toolkit" active={active}>
      <div data-content className="section-intro"><h2 id="skills-heading">Tools with<br /><span className="muted">a purpose.</span></h2><p className="muted section-description">A toolkit spanning backend systems, cloud delivery, testing, and AI.</p></div>
      <div className="section-scroll skills-grid" role="region" aria-labelledby="skills-heading" tabIndex={0} data-content>
        {skillGroups.map((group) => <SkillGroup key={group.category} group={group} />)}
      </div>
    </Section>

    <Section id="education" label="Education" active={active}>
      <div data-content className="section-intro"><h2 id="education-heading">Always<br /><span className="muted">learning.</span></h2></div>
      <div className="section-scroll" role="region" aria-labelledby="education-heading" tabIndex={0} data-content><EducationCard education={education} /></div>
    </Section>

    <Section id="contact" label="Contact" active={active}>
      <div data-content className="section-intro"><h2 id="contact-heading">Let’s build<br /><span className="muted">something meaningful.</span></h2></div>
      <div className="section-scroll contact-copy" role="region" aria-labelledby="contact-heading" tabIndex={0} data-content>
        <p className="muted">Interested in backend systems, distributed workflows, or AI engineering? Let’s connect.</p>
        <a className="contact-email" href={`mailto:${portfolio.email}`}>{portfolio.email}</a>
        <div className="contact-links"><a className="text-link" href={portfolio.github}>GitHub <span aria-hidden="true">↗</span></a><a className="text-link" href={portfolio.linkedin}>LinkedIn <span aria-hidden="true">↗</span></a></div>
        {portfolio.resumeUrl && <a className="text-link" href={portfolio.resumeUrl} download>Download resume <span aria-hidden="true">↓</span></a>}
        <p className="tiny-label">{portfolio.location}</p>
        <p className="copyright">© {new Date().getFullYear()} {portfolio.name}</p>
      </div>
    </Section>
  </>
}
