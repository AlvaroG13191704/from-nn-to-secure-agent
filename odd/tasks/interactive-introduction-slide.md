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
- [x] T3 — Implement the AI-to-agents conceptual sequence with one meaningful responsive SVG animation per topic.
- [x] T4 — Implement `/register`, persistence, return navigation, and registered-state feedback.
- [x] T5 — Verify Svelte components with the Svelte autofixer, run focused checks and build, validate reduced motion/responsiveness, and record evidence.

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

- Status: T1–T5 complete; the first interactive workshop slide is ready for local review.
- Decision: real realtime presence and AWS infrastructure are deferred until the final slides are ready.
- T1 correction: restore the persisted section before initial scroll tracking; use stacked panels on reduced-motion and short landscape layouts, with overflow scrolling available for enlarged content.
- T2: replaced the opening placeholders with a concise introduction, first-name-only presenter profile, and two-session overview. The workshop timeline uses a restrained progressive reveal that becomes static with reduced motion; the seven topic animations remain deferred to T3.
- T2 assessment: parent recorded `medium / under_budget` for the accumulated range.
- T3: added seven concept cards in the existing workshop panel. Each includes a responsive inline SVG that reveals its explanatory stages when the topic enters view; full diagrams and text remain available without motion. No visualization dependency was added.
- T2–T3 assessment: parent recorded `medium / review declined by user`; work continued under ordinary policy.
- T4: added a client-only registration page that validates name and carnet, persists through the existing browser-local session controller, and lets registered users update their name without displaying the saved carnet. The navigation link reflects the registered state, and the return link preserves the presentation route/progress. The presence simulation remains replaceable behind its provider interface and is explicitly described as simulated in the UI.
- T5 initial independent verification: status was `PARTIAL`; browser checks found two P2 defects—section progress reset after returning from registration, and the two-column workshop timeline overflowed at 375×812. Check/build passed; the Svelte analyzer was unavailable because `svelte.dev` resolution failed (`ENOTFOUND`) and offline package resolution failed (`ENOTCACHED`). T5 remains pending independent re-verification.
- T5 corrections: confirmed the progress reset was caused by SvelteKit's navigation ordering: `finish_navigation` calls `restore_scroll` after route `onMount` and before `afterNavigate`, so the default scroll-to-top overwrote the shell's early restore and recorded section zero. Restore now runs in `afterNavigate`, after SvelteKit's scroll handling, with no initial pre-reset jump. At widths ≤640px the workshop timeline becomes a single-column sequence with a vertical connector and wrapping cards.
- T5 final verification: an independent verifier repeated check/build/diff checks successfully but temporarily lacked a browser surface. The parent then completed a fresh browser pass once the local browser became available: section 3 survived registration navigation and two reloads; the 375×812 timeline stayed within a 375px document with a 285px card; and the 844×390 layout exposed the final agent topic while the fixed navbar remained visible.

## Verification evidence

- `web/`: `npm run check` passed with 0 errors and 0 warnings; `npm run build` passed. The adapter-auto informational message reported no production adapter detected.
- Svelte autofixer (`@sveltejs/mcp svelte-autofixer`, Svelte 5) ran on all four changed Svelte files: no issues or suggestions for layout, home route, and navigation; presentation shell had no issues and two optional `bind:this` suggestions.
- `git diff --check` passed for T1 source surfaces.
- Correction verification: `npm run check` passed with 0 errors and 0 warnings; `npm run build` passed; the presentation shell autofixer reported no issues and two optional `bind:this` suggestions. No test script is configured in `web/package.json`, so no new test dependency was added.
- T1 correction commit `6f9bcee`: parent assessment recorded `medium / under_budget`.
- T2 verification: `web/` `npm run check` passed with 0 errors and 0 warnings; `npm run build` passed. The build emitted only environment/color warnings and the adapter-auto informational message that no production adapter is configured.
- T2 Svelte autofixer (Svelte 5): `ScrollytellingShell.svelte` reported no issues and two optional `bind:this` suggestions; `WorkshopJourney.svelte` reported no issues or suggestions. An initial conditional-block syntax finding was corrected before final checks.
- T2 `git diff --check` passed for the allowed source and task-document surfaces.
- T3 verification: `web/` `npm run check` passed with 0 errors and 0 warnings; `npm run build` passed. Adapter-auto again reported no production adapter configured, and Node reported the existing `NO_COLOR`/`FORCE_COLOR` environment warning.
- T3 Svelte autofixer (Svelte 5): `ScrollytellingShell.svelte`, `TopicLearningSequence.svelte`, and `ConceptDiagram.svelte` reported no issues; the first two had optional `bind:this` suggestions. The T3 visuals use no D3/GSAP dependencies because hand-authored SVG with CSS sequencing is sufficient.
- T3 `git diff --check` passed for the allowed presentation, visualization, and task-document surfaces. No test runner is configured, and no framework was added for static presentation content.
- T4 verification: `web/` `npm run check` passed with 0 errors and 0 warnings; `npm run build` passed with only the existing adapter-auto informational notice and Node `NO_COLOR`/`FORCE_COLOR` warning. Svelte 5 autofixer reported no issues or suggestions for `register/+page.svelte` and `NavigationBar.svelte`. No test runner is configured in `web/package.json`, so no dependency was added for the form.
- T5 correction verification: `web/` `npm run check` passed with 0 errors and 0 warnings; `npm run build` passed with the existing adapter-auto notice and Node color-environment warning. Svelte 5 autofixer found no issues in `ScrollytellingShell.svelte` or `WorkshopJourney.svelte`; it offered only two optional `bind:this` suggestions for the shell. A final browser pass at 1366×768 reached section 3, opened `/register`, saved and reloaded test registration, returned to `/`, and retained section 3 after another reload. At 375×812 the `Fundamentos` heading and its 285px card remained within the 375px document (`scrollWidth === clientWidth`); at 844×390 the agent heading was reachable and the navbar stayed fixed. Reduced-motion behavior remains supported by code and earlier structural checks, but browser-level media emulation was unavailable.

## Refinement plan (2026-10-13)

- [x] T6 — Correct title and first-person voice, reclaim horizontal width, add optional portrait and document its drop-in path.
- [ ] T7 — Repair journey and diagram geometry; expand AI purpose and ML learning regimes, model families, training and inference.
- [ ] T8 — Run Svelte checks/build/autofixer and inspect desktop/mobile screenshots, including animation states and registration-return persistence.
- Route: delegated direct for all three tasks; coordinated multi-file visual/content changes trigger the writer and preparation rules.
- Forecast: approximately 450–650 authored changed lines; existing feature-branch-chain applies.
- RDD: globally disabled, ordinary checks only.
- Test-first exception: no configured deterministic visual test runner; derive geometry failures and capture the current render before fixing, then inspect the corrected render.
- Preserve pre-existing package-manager, ignore-file and skill-lock edits. No dependency installation or backend.
- Evidence before changes: journey connector begins at 12.5% although markers are left-aligned; 641–900px removes connector entirely. IA curve peaks at y=32 while title baseline is y=35. Deep output circles overlap (40px center distance with 24px radii). LLM selection arrow ends above its destination. SVG draw-edge animation has no nonzero starting dashoffset.

- T6 proof: title, first-person presenter and learning voice, reduced outer/inner gutters and responsive optional portrait verified in desktop/mobile screenshots. `npm run check` passes (0 errors/warnings), `npm run build` passes, nine Svelte autofixers report no issues (only optional bind:this suggestions). Portrait drop-in documented in web/README.md; SvelteKit 3 uses `asset()` rather than removed `base`.

## Next step

Review the first slide visually with the presenter, then iterate on content or begin the next workshop route. Realtime AWS presence remains intentionally deferred.
