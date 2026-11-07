# Chandra Vamshi Katineni — developer portfolio

React, TypeScript, Vite, Tailwind CSS, and Canvas 2D. Personal biography, projects, education, and contact details are clearly marked placeholders until supplied by the owner.

## Development

Use Node.js 24 and npm. Run `npm ci`, then `npm run dev`. On PowerShell use `npm.cmd` if script execution policy blocks `npm.ps1`. The development server binds to localhost.

Validation: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Run `npm run preview` for the production preview.

## Architecture

`src/content/portfolio.ts` contains identity and sections. `src/components/` contains semantic content. `src/features/particles/` separates physics, geometry, gestures, Canvas rendering, and UI. `src/features/navigation/` manages the desktop presentation. `tests/` holds independent behavior tests.

## Interaction

Click particles in empty background to freeze; double-click to release. Drag empty space to freeze a region. Particle controls provide pause, release selection, and release all. On touch, tap toggles a particle; Select region enables drag selection while ordinary touch scrolling stays available outside that mode. Keyboard selection supports arrows to move and Shift+arrows to resize, plus freeze/release buttons.

Desktop vertical scrolling drives horizontal sections when content fits. Mobile, short viewports, long content, and reduced motion use native vertical sections. Reduced motion shows a static particle name. The canvas is decorative; semantic HTML preserves the name and content for assistive technology.

Particle count, pixel density, and frame delta are capped. Hidden tabs suspend animation. Frozen positions survive resizing; Release all can release particles outside a resized viewport.

Application CI validates locked installation, lint, types, tests, and production build. Existing configuration CI separately validates agent definitions, workflow YAML, and PR routing using Python and PyYAML 6.0.2. Task PRs target `develop`; see `AGENTS.md` for the complete workflow. Hosting, analytics, contact forms, and paid services are outside this milestone.

Dependency audit currently reports seven moderate development-only findings rooted in the `minimatch` glob parsing advisory GHSA-g3hv-75wg-m249 through TypeScript ESLint. The available remediation requires changing its transitive major version or downgrading the lint toolchain; no forced dependency change is applied. The affected package is excluded from the production browser bundle.
