# Interactive introduction slide

## Objective

Build the first workshop route as an accessible horizontal scrollytelling presentation driven by vertical scroll, including the presenter introduction, workshop overview, AI foundations, browser-persisted registration, and a clearly simulated active-user counter.

## Authorized scope

- Replace the placeholder home route with the first presentation experience.
- Add reusable presentation, navigation, animation, registration, and local-session modules under `web/src/**`.
- Add a `/register` route for name and student ID registration.
- Persist registration and presentation progress in the current browser.
- Simulate live presence behind a replaceable frontend interface; do not add a real backend, AWS resources, credentials, or deployment configuration.
- Use the supplied CV and `doc/workshop.md` / `doc/ia.md` only as content sources.
- Preserve unrelated and pre-existing changes, especially `.agents/**`, `.atl/**`, `doc/**`, and `skills-lock.json`.

## Constraints

- Spanish, neutral and student-friendly UI copy.
- Projector-readable light-friendly palette standardized with Tailwind CSS 4 theme tokens.
- Friendly typography, visible focus states, semantic HTML, keyboard support, and reduced-motion behavior.
- Animations must explain the concept rather than decorate it.
- Browser-only APIs must not execute during SSR.
- The presence simulation must be labeled as such in code and replaceable without changing consuming UI.

## Route and forecast

- **Route:** delegated direct; the implementation requires coordinated reading and changes across multiple non-trivial Svelte and TypeScript files.
- **Trigger evidence:** writer and preparation triggers apply because the scrollytelling shell, topic animations, persistence, navigation, and registration form form one integrated feature.
- **Test policy:** use deterministic unit tests for pure session/progress behavior when practical; otherwise verify through Svelte checks, build, and structural accessibility checks.
- **Initial authored-line forecast:** 700–1,000 lines, excluding generated files and lockfiles.
- **Delivery strategy:** `feature-branch-chain` (selected by the user after the T1 line-count forecast exceeded the delivery budget); no remote delivery is authorized.

## Checklist

- [x] T1 — Establish the visual system, shared navigation, local registration/progress state, simulated presence adapter, and horizontal scrollytelling shell.
- [x] T2 — Implement presenter and workshop-overview sections using the supplied sources with privacy-safe copy.
- [ ] T3 — Implement the AI-to-agents conceptual sequence with one meaningful responsive SVG animation per topic.
- [ ] T4 — Implement `/register`, persistence, return navigation, and registered-state feedback.
- [ ] T5 — Verify Svelte components with the Svelte autofixer, run focused checks and build, validate reduced motion/responsiveness, and record evidence.

## Acceptance criteria

- Vertical scrolling advances horizontally through one coherent presentation route.
- The fixed navbar always shows the simulated active-user count and registration state.
- Registration persists across reloads in the same browser, without exposing the student ID unnecessarily in the UI.
- Presenter facts are accurate, privacy-safe, and do not claim unfinished certifications as earned.
- The workshop overview reflects two two-hour sessions and the final quiz.
- AI, ML, neural networks, deep learning, NLP, LLMs, and agents each receive concise explanation and meaningful motion.
- The experience remains understandable with animation disabled.
- `npm run check` and `npm run build` pass.

## Progress

- Status: T1–T2 complete; T3–T5 remain pending.
- Decision: real realtime presence and AWS infrastructure are deferred until the final slides are ready.
- T1 correction: restore the persisted section before initial scroll tracking; use stacked panels on reduced-motion and short landscape layouts, with overflow scrolling available for enlarged content.
- T2: replaced the opening placeholders with a concise introduction, first-name-only presenter profile, and two-session overview. The workshop timeline uses a restrained progressive reveal that becomes static with reduced motion; the seven topic animations remain deferred to T3.

## Verification evidence

- `web/`: `npm run check` passed with 0 errors and 0 warnings; `npm run build` passed. The adapter-auto informational message reported no production adapter detected.
- Svelte autofixer (`@sveltejs/mcp svelte-autofixer`, Svelte 5) ran on all four changed Svelte files: no issues or suggestions for layout, home route, and navigation; presentation shell had no issues and two optional `bind:this` suggestions.
- `git diff --check` passed for T1 source surfaces.
- Correction verification: `npm run check` passed with 0 errors and 0 warnings; `npm run build` passed; the presentation shell autofixer reported no issues and two optional `bind:this` suggestions. No test script is configured in `web/package.json`, so no new test dependency was added.
- T1 correction commit `6f9bcee`: parent assessment recorded `medium / under_budget`.
- T2 verification: `web/` `npm run check` passed with 0 errors and 0 warnings; `npm run build` passed. The build emitted only environment/color warnings and the adapter-auto informational message that no production adapter is configured.
- T2 Svelte autofixer (Svelte 5): `ScrollytellingShell.svelte` reported no issues and two optional `bind:this` suggestions; `WorkshopJourney.svelte` reported no issues or suggestions. An initial conditional-block syntax finding was corrected before final checks.
- T2 `git diff --check` passed for the allowed source and task-document surfaces.

## Next step

Proceed with T3; T3–T5 remain pending.
