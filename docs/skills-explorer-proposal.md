# Skills Explorer — approval proposal

Status: approved for implementation. The owner supplied the rating overrides below and instructed the agent to continue. Evidence scope and limitations remain unchanged.

Approved rating overrides: Python 4; Django REST 4; AWS 4.5; Docker 4.5; Git 5; React 2.5; Cypress 3.5; Codex CLI 4; AI Agents 4; RAG 3; LLMs 4. All other initial values below were accepted with the instruction to continue. The list below records the original proposal; this approval block supersedes its changed numbers. Implemented ratings are owner-approved self-assessments, not objective measurements. Merge and deployment remain unauthorized.

Source: the owner's latest Skills Explorer request and the existing resume content in src/content/portfolio.ts. Scope: 35 existing skill chips, five additional project-stack technologies (React, NLP, LLMs, AI Agents, RAG), and Splunk from professional experience: 41 entries. JWT and RBAC remain supporting Campus Marketplace capabilities rather than extra skill chips.

## Rating policy

Every number below is an assistant-suggested provisional starting point for the owner's review, not an established self-assessment or objective measurement. Evidence depth informs the suggestions but does not determine ability. A knowledge-only designation describes missing resume evidence, not a judgment that the owner cannot use the tool. The shared 2/5 suggestions for knowledge-only entries are placeholders requiring explicit owner confirmation.

Scale: 0–5 in 0.5 increments. 1 = basic familiarity; 2 = foundational knowledge; 3 = comfortable with common tasks; 4 = strong practical experience; 5 = advanced expertise. Intermediate values sit between adjacent descriptions. No 5/5 expertise claim is proposed. A bar represents the chosen scale value directly; it is not an independently measured confidence percentage.

Store proficiency centrally as a value with approval status. Unapproved values must not appear as confirmed public ratings; show 'Rating awaiting review' and no numerical confidence fill until approved. Approval must cover the numbers, not only the evidence mapping.

## Complete technology mapping and provisional ratings

P = professional evidence; J = project evidence; K = Knowledge / Familiarity. K entries must display: 'The resume lists this skill but does not document a specific implementation.' Do not attach employer or project references to K entries.

### Languages — 6

- **Java — 4/5 — P + J.** MetLife: backend policy-processing services and REST APIs. HCL Tech: enterprise document-processing components. Distributed ERP: Java in the event-driven inventory-processing stack.
- **Python — 3.5/5 — J.** Campus Marketplace: backend APIs and authentication, access-control, messaging, offers, reviews, and moderation workflows using Python/Django REST. Multi-Agent Prompt Enhancer: Python in the agent-based enhancement, validation, and feedback stack; under development.
- **C++ — 2/5 — K.** No specific implementation documented.
- **JavaScript — 2/5 — K.** No specific implementation documented. React's appearance in a project stack does not establish JavaScript or frontend ownership.
- **TypeScript — 2/5 — K.** No specific implementation documented. The portfolio's own code does not establish resume-backed experience.
- **SQL — 4/5 — P + J.** MetLife: PostgreSQL query optimization reduced API latency from 400 ms to under 100 ms. HCL Tech: MySQL query/index optimization on 2M+ metadata rows. Distributed ERP: transactional SQL within inventory processing. This is database-query evidence, not an additional claimed language-specific achievement.

### Backend & Distributed Systems — 9

- **Spring Boot — 4/5 — P + J.** MetLife: backend policy-processing services and REST APIs. Distributed ERP: Spring Boot in the event-driven inventory-processing stack.
- **Django REST — 3.5/5 — J.** Campus Marketplace: backend APIs, JWT authentication, RBAC, messaging, offers, reviews, and moderation. Backend ownership only.
- **REST APIs — 4/5 — P + J.** MetLife: backend policy-processing APIs. HCL Tech: integrations for operations specialists. Campus Marketplace: backend APIs and the documented marketplace workflows.
- **Microservices — 2/5 — K.** The resume describes modular services but does not explicitly attribute a specific microservices implementation to this skill; do not equate the two automatically.
- **Kafka — 4/5 — P + J.** MetLife: workflows handling 20,000+ daily policy updates. Distributed ERP: event-driven inventory processing.
- **RabbitMQ — 3.5/5 — P.** HCL Tech: asynchronous document-processing workflows.
- **Redis — 2/5 — K.** No specific implementation documented.
- **PostgreSQL — 4/5 — P + J.** MetLife: query optimization reduced API latency from 400 ms to under 100 ms. Campus Marketplace: PostgreSQL is part of the backend project stack; the resume does not isolate particular marketplace database work or performance results.
- **MySQL — 4/5 — P + J.** HCL Tech: query and index optimization on 2M+ metadata rows. Distributed ERP: MySQL in the event-driven inventory-processing stack.

### Cloud & DevOps — 10 (9 existing + Splunk)

- **AWS — 3/5 — J.** Distributed ERP: AWS is listed in the event-driven inventory and deployment stack. No individual AWS service or professional cloud ownership is specified.
- **Docker — 3/5 — J.** Distributed ERP: containerized deployment of the inventory-processing services.
- **Kubernetes — 2/5 — K.** No specific implementation documented.
- **Git — 3/5 — J.** Multi-Agent Prompt Enhancer: Git is listed in the development stack for agent-based prompt enhancement, validation, and user-feedback workflows; under development. No particular branching or collaboration achievement is documented.
- **GitHub — 2/5 — K.** No specific implementation documented; a profile link is not evidence of a particular project workflow.
- **Jenkins — 3/5 — P.** MetLife: CI/CD integration with automated testing.
- **GitHub Actions — 2/5 — K.** No resume-documented implementation; do not use this portfolio's CI as a personal resume claim.
- **CI/CD — 3.5/5 — P.** MetLife: Jenkins CI/CD integration. No undocumented pipeline design or deployment ownership claim.
- **Linux — 2/5 — K.** No specific implementation documented.
- **Splunk — 3/5 — P.** MetLife: production troubleshooting. No new incident-reduction metric is attributed to Splunk alone.

### Testing — 6

- **JUnit — 4/5 — P.** MetLife: automated tests with JUnit and Mockito maintaining 90%+ coverage. Coverage belongs to the combined automated test effort, not a separate score for each tool.
- **Mockito — 4/5 — P.** MetLife: automated tests with JUnit and Mockito maintaining 90%+ coverage.
- **Cypress — 2.5/5 — J (stack evidence only).** Campus Marketplace: Cypress is listed in the project stack. The resume does not document which tests the owner wrote or frontend testing ownership.
- **Unit Testing — 3.5/5 — P.** MetLife: automated testing using JUnit and Mockito, with 90%+ coverage. Describe the documented automated testing work without claiming a separately measured unit-only coverage percentage.
- **Integration Testing — 2/5 — K.** No specific integration-test implementation documented; REST integrations do not establish integration testing.
- **End-to-End Testing — 2/5 — K.** Cypress is in a project stack, but a specific end-to-end testing implementation or owner responsibility is not documented.

### AI Tools & Engineering — 9 (5 existing + 4 project technologies)

- **Codex CLI — 3/5 — J.** Multi-Agent Prompt Enhancer: tool in the agent-based prompt enhancement, validation, and feedback stack; under development.
- **Claude Code — 2/5 — K.** No specific implementation documented.
- **Cursor — 2/5 — K.** No specific implementation documented.
- **Gemini — 2/5 — K.** No specific implementation documented.
- **ChatGPT — 2/5 — K.** No specific implementation documented.
- **NLP — 2.5/5 — J.** Multi-Agent Prompt Enhancer: NLP is listed in the prompt enhancement and validation stack; under development. No specific algorithm or evaluation result is documented.
- **LLMs — 2.5/5 — J.** Multi-Agent Prompt Enhancer: LLMs in the agent-based enhancement, validation, and feedback workflow; under development. No model training or production deployment claim.
- **AI Agents — 2.5/5 — J.** Multi-Agent Prompt Enhancer: planner, enhancer, reviewer, and evaluator workflows for prompt enhancement, validation, and user feedback; under development.
- **RAG — 2.5/5 — J (development-stack evidence).** Multi-Agent Prompt Enhancer: RAG is listed in the stack; under development. The resume does not describe a completed retrieval implementation, vector database, or retrieval performance result.

### Frontend — 1 project technology

- **React — 2/5 — J (stack evidence only).** Campus Marketplace: React is part of the team project's stack. The owner documented backend ownership; do not claim frontend ownership or specific React components built.

## Smallest implementation extension after approval

- Preserve the existing Skills heading, categories, dark theme, and compact chip layout. Add a Frontend category for React, extend AI Tools to AI Tools & Engineering, and add Splunk to Cloud & DevOps. No whole-section redesign.
- Add one centralized typed skill registry containing id, name, category, proficiency (value plus approval status), evidenceType, experienceReferences, projectReferences, description, evidenceSummary, and an icon key. Allow professional and project evidence together. Use stable reference IDs and shared reference records rather than duplicating resume facts across JSX.
- Use reusable SkillCard buttons and one SkillDetail panel that updates as another skill is selected. Keep selected state and detail IDs stable. Desktop uses an inline animated panel; mobile uses a stacked panel so other skills remain reachable without modal focus trapping.
- Show name/icon, approved self-assessed value out of 5, scale interpretation, a matching restrained confidence bar, and separate Professional experience / Projects evidence blocks when present. Show project-stack limitations and under-development labels inside relevant evidence. Knowledge-only entries show the standard familiarity explanation.
- Use native buttons with Enter/Space and normal Tab access; provide panel heading/association and a polite selection announcement, visible focus, and an accessible 0–5 meter for approved ratings. Avoid forced focus changes that prevent switching skills. Respect reduced motion and preserve the horizontal track's measurement/refresh behavior.
- Restrained white, silver, and blue-gray styling; local lightweight icons or clear category glyphs, no new animation dependency. The bar fills from zero to value/5 with no percentage claim. Reduced motion renders the endpoint immediately.
- Developer owns the new content registry, SkillCard/SkillDetail/explorer components, and minimal Skills integration/styles. Tester owns tests. Reviewer checks every mapping, rating status, provenance limitation, and accessibility on the stable implementation.
- Verify all 41 buttons and evidence/rating values, keyboard selection/switching, screen-reader semantics, mobile layout, half-point validation, reduced motion, existing intro/Muse/particles/navigation, lint, types, tests, and production build. No merge or deployment.

## Worktree and approval boundary

The new task branch feature/interactive-skills-explorer was created from freshly fetched origin/develop (210cec4) in .worktrees/skills-explorer. Existing uncommitted intro/Muse work remains untouched in .worktrees/two-star-universe-intro. Implementation will preserve those existing visual behaviors; integrating them into the new task worktree must preserve the original worktree and keep their baseline distinct from Skills changes.

Approval received: the complete 41-entry mapping and minimal interaction plan, with the explicit rating overrides recorded at the top. No approval was inferred from silence.
