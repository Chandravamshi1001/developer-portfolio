# Chandra Vamshi Katineni — developer portfolio

React, TypeScript, Vite, Tailwind CSS, and Canvas 2D. The seven sections present the owner's supplied professional summary, experience, projects, skills, education, and contact links. Claims and metrics come from owner-provided resume content.

## Development

Use Node.js 24 and npm. Run `npm ci`, then `npm run dev`. On PowerShell use `npm.cmd` if script execution policy blocks `npm.ps1`. The development server binds to localhost.

Validation: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Run `npm run preview` for the production preview.

## Architecture

`src/content/portfolio.ts` contains typed identity, section definitions, and resume facts. `src/components/` contains semantic sections and reusable experience, project, skill, and education cards. `src/features/particles/` separates physics, geometry, gestures, Canvas rendering, and UI. `src/features/navigation/` manages the desktop presentation. `tests/` holds independent behavior tests.

An optional `resumeUrl` is deliberately unset until an actual resume PDF is provided. Download links render only when that asset is configured. Project repository URLs are omitted because none were supplied.

## Interaction

Click particles in empty background to freeze; double-click to release. Drag empty space to freeze a region. Particle controls provide pause, release selection, and release all. On touch, tap toggles a particle; Select region enables drag selection while ordinary touch scrolling stays available outside that mode. Keyboard selection supports arrows to move and Shift+arrows to resize, plus freeze/release buttons.

Desktop vertical scrolling drives one horizontal section track through a pinned, scrubbed GSAP ScrollTrigger. Horizontal travel and pin distance use the measured track width minus the viewport width and refresh on resize. Longer content and expanded details continue into additional horizontal columns without nested section scrollbars. Section anchors, keyboard focus, and browser Back/Forward map to the same track positions. Mobile, coarse-pointer devices, very short viewports, and reduced motion use native vertical document flow. Reduced motion shows a static particle name and disables text entrances. The fixed canvas stays outside the moving track; semantic HTML preserves the full name and content for assistive technology.

Particle count, pixel density, and frame delta are capped. Hidden tabs suspend animation. Frozen positions survive resizing; Release all can release particles outside a resized viewport.

Application CI validates locked installation, lint, types, tests, and production build. Existing configuration CI separately validates agent definitions, workflow YAML, and PR routing using Python and PyYAML 6.0.2. Task PRs target `develop`; see `AGENTS.md` for the complete workflow. Hosting, analytics, contact forms, and paid services are outside this milestone.

Dependency audit currently reports seven moderate development-only findings rooted in the `minimatch` glob parsing advisory GHSA-g3hv-75wg-m249 through TypeScript ESLint. The available remediation requires changing its transitive major version or downgrading the lint toolchain; no forced dependency change is applied. The affected package is excluded from the production browser bundle.
