# Istraživači našeg svijeta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, test and publicly deploy a fourth self-contained learning app that covers the full second-grade *Istražujemo naš svijet 2* scope through 11 worlds, three difficulty levels and original interactive tasks.

**Architecture:** A browser/CommonJS-compatible engine owns validation, deterministic sessions and persistence; a content module owns 396 template factories and seeded round generation; a DOM UI renders seven interaction types without external runtime dependencies. A build script inlines source into one HTML file, and the existing portal build publishes it beside the three current apps.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript (UMD/CommonJS), Node.js built-in test runner, JSDOM 26.1.0 for UI tests, GitHub and Render static hosting.

**Spec:** `docs/superpowers/specs/2026-11-12-istrazivaci-naseg-svijeta-design.md`

## Global Constraints

- Eleven worlds, three levels and at least 12 templates per world-level combination: exactly 396 template factories in v1.
- Original content only; do not copy book pages, exercises, photography, illustrations or publisher branding.
- Seven interaction types: `single`, `match`, `sort`, `order`, `cause`, `observe`, `timeline`.
- Immediate correct/incorrect feedback; no help or solution buttons; incorrect answers remain retryable.
- Hard tasks must be cognitively different from medium tasks, not just contain another option.
- One self-contained production HTML file with no runtime network dependency, analytics, account or personal data.
- Keyboard support, preserved local focus, `aria-live`, `prefers-reduced-motion`, WCAG AA text contrast and 44 px minimum controls.
- Public route `/istrazivaci-naseg-svijeta/index.html`; preserve the three existing apps.

## Review Focus

- A malformed saved response missing sort zones or sequence items must be rejected without showing a broken resume control (Task 3 tests).
- Repeated labels inside order/timeline tasks must remain selectable, removable and gradable by occurrence rather than by unique text (Tasks 1 and 4 tests).
- Every easy/medium grouped sequence must still represent the complete activity and not truncate a process (Task 2 tests).
- A second same-world round must avoid all immediately previous question IDs when the 12-template bank permits it (Task 4 tests).
- Long Croatian labels at 320 px width must wrap without overflow while every control keeps an accessible name and useful keyboard focus (Task 4 tests).

---

### Task 1: Deterministic answer and session engine

**Files:**
- Create: `istrazivaci-naseg-svijeta/package.json`
- Create: `istrazivaci-naseg-svijeta/src/engine.js`
- Create: `istrazivaci-naseg-svijeta/tests/engine.test.cjs`

**Interfaces:**
- Consumes: no project code.
- Produces: `makeRng(seed)`, `shuffle(values,rng)`, `complete(question,response)`, `check(question,response)`, `createSession(level,world,seed,questions)`, `submit(session,response)`, `advance(session)`, and `summarize(session)` on `WorldEngine` and `module.exports`.

- [ ] **Step 1: Write failing engine tests**

Add tests named `validates exact complete answers for all seven interaction types`, `rejects partial duplicate and wrong answers including repeated sequence labels`, and `counts retries locks solved questions and summarizes the round`. Fixtures define the exact response shapes: `{selected}`, `{pairs}`, `{zones}`, and `{items}`.

- [ ] **Step 2: Run the tests and verify RED**

Run: `cd istrazivaci-naseg-svijeta && npm test`

Expected: FAIL because `src/engine.js` does not exist.

- [ ] **Step 3: Implement the pure engine API**

Use normalized Croatian text comparison, multiset comparison for repeated values, exact pair matching, exact zone membership, and ordered item comparison. `submit` increments attempts once per complete submission and never reveals the expected answer.

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `npm test`

Expected: all Task 1 tests pass.

- [ ] **Step 5: Checkpoint Task 1**

Sync the three files with a commit message `feat: add nature learning session engine`.

### Task 2: Full-year curriculum content and seeded round generator

**Files:**
- Create: `istrazivaci-naseg-svijeta/src/content.js`
- Modify: `istrazivaci-naseg-svijeta/tests/engine.test.cjs`

**Interfaces:**
- Consumes: `WorldEngine.makeRng`, `shuffle`, and `check` from Task 1.
- Produces: `levels`, `worlds`, `templates`, `templateCount()`, and `buildRound(level,world,seed)` on `WorldContent` and `module.exports`.

- [ ] **Step 1: Write failing coverage and generation tests**

Assert 11 exact world IDs, three exact level IDs, 12 factories per world-level and `templateCount() === 396`. Across 100 seeds per world-level, assert five unique, deterministic, solvable questions; mixed rounds contain 11 questions and all worlds. Add focused assertions that easy and medium sequences retain the final step, and medium/hard direct questions differ in scenario and expected answer.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test`

Expected: FAIL because `content.js` and the 396 factories do not exist.

- [ ] **Step 3: Implement the content module**

Define the 11 worlds from the spec and 12 original base scenarios per world. Each level factory creates a distinct task: easy reduces simultaneous information, medium combines relationships, and hard adds a situational comparison, consequence, criterion, sketched route or interpreted observation. Group steps for easier sequences instead of slicing them.

- [ ] **Step 4: Run exhaustive content tests and verify GREEN**

Run: `npm test`

Expected: all engine and content tests pass, including at least 16,500 generated world questions plus mixed rounds.

- [ ] **Step 5: Checkpoint Task 2**

Commit with message `feat: add full-year nature and society content bank`.

### Task 3: Strict persistence and safe reconstruction

**Files:**
- Modify: `istrazivaci-naseg-svijeta/src/engine.js`
- Modify: `istrazivaci-naseg-svijeta/tests/engine.test.cjs`

**Interfaces:**
- Consumes: Task 1 sessions and Task 2 `buildRound(level,world,seed)`.
- Produces: `serialize(session)` and `restore(raw,buildRound)`.

- [ ] **Step 1: Write failing persistence tests**

Add tests `serialization reconstructs identical seeded questions and progress` and `restore rejects corrupt impossible injected and incomplete-shaped states`. Include invalid JSON, unknown level/world, wrong array lengths, missing sort zones, over-counted repeated items, future solved questions and inconsistent phases.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test`

Expected: FAIL because `serialize` and `restore` are absent or accept malformed state.

- [ ] **Step 3: Implement strict versioned persistence**

Persist only version, level, world, seed, index, phase, attempts, solved and responses. Rebuild questions from `buildRound`; validate every response against rebuilt options/items and all session invariants inside a no-throw boundary.

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `npm test`

Expected: all persistence and earlier tests pass.

- [ ] **Step 5: Checkpoint Task 3**

Commit with message `feat: persist and validate nature learning sessions`.

### Task 4: Responsive seven-interaction UI

**Files:**
- Create: `istrazivaci-naseg-svijeta/src/index.html`
- Create: `istrazivaci-naseg-svijeta/src/app.js`
- Create: `istrazivaci-naseg-svijeta/src/styles.css`
- Create: `istrazivaci-naseg-svijeta/tests/ui.test.cjs`

**Interfaces:**
- Consumes: all Task 1–3 `WorldEngine` and Task 2 `WorldContent` exports.
- Produces: the complete browser app and `localStorage` key `world-explorers-session-v1`.

- [ ] **Step 1: Write failing navigation and interaction tests**

Using JSDOM, test home → three levels → 11 worlds plus mixed → exercise; test incorrect retry and correct completion for all seven interaction types; test removable sort/match/order assignments; test a completed five-question round; test resume, corrupt storage and blocked storage; test all 33 world-level and three mixed selections.

- [ ] **Step 2: Write failing accessibility, focus and freshness tests**

Assert accessible button names, `aria-live`, 44 px targets, focus style, `prefers-reduced-motion`, no overflow rule regression at 320 px, selected-state ARIA, focus preservation after local choices, repeated sequence removal by occurrence, and zero ID overlap when restarting the same world.

- [ ] **Step 3: Run UI tests and verify RED**

Run: `npm test`

Expected: FAIL because the UI files do not exist.

- [ ] **Step 4: Implement the screens and Lumi artwork**

Create home, world selection, exercise, correct, retry and results screens. Render `single/cause` as decisions, `match`, `sort`, `order`, `observe` as an illustrated observation panel, and `timeline` as an ordered time/route workspace. Use the approved palette and original inline SVG Lumi.

- [ ] **Step 5: Implement navigation, focus and storage behavior**

Use event delegation without nested interactive elements, preserve focus on the updated local control, validate restored sessions before resume, and try up to 64 deterministic candidate seeds to find a no-overlap same-world round.

- [ ] **Step 6: Run the full UI suite and verify GREEN**

Run: `npm test`

Expected: every engine, content, persistence and UI test passes with no JSDOM errors.

- [ ] **Step 7: Checkpoint Task 4**

Commit with message `feat: build interactive world explorers UI`.

### Task 5: Standalone build and four-app portal integration

**Files:**
- Create: `istrazivaci-naseg-svijeta/scripts/build.cjs`
- Create: `istrazivaci-naseg-svijeta/tests/build.test.cjs`
- Create: `istrazivaci-naseg-svijeta/dist/index.html` (generated)
- Modify: `istrazivaci-naseg-svijeta/package.json`
- Modify: `build-page-apps.mjs`
- Create: `page-apps/istrazivaci-naseg-svijeta.html` (generated)
- Create: `javne-aplikacije/istrazivaci-naseg-svijeta/index.html` (generated)
- Modify: `javne-aplikacije/index.html` (generated)

**Interfaces:**
- Consumes: Task 4 source UI and the existing portal build.
- Produces: one self-contained app artifact and a portal with four explicit `index.html` routes.

- [ ] **Step 1: Write a failing build/integration test**

Assert that the app build emits one HTML file below 256 KiB with embedded CSS/JS and no external runtime reference; the public copy is byte-identical; the portal contains exactly four cards and explicit routes for all four apps.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test`

Expected: FAIL because the build script and public route do not exist.

- [ ] **Step 3: Implement standalone and portal builds**

Inline the three source scripts and stylesheet in order. Extend `build-page-apps.mjs` to copy the artifact and generate a responsive four-card portal without changing the existing app artifacts.

- [ ] **Step 4: Run the full check and verify GREEN**

Run: `npm run check`

Expected: syntax checks, all tests and the standalone build pass.

- [ ] **Step 5: Checkpoint Task 5**

Commit with message `feat: integrate world explorers into public portal`.

### Task 6: Final review, GitHub sync and Render publication

**Files:**
- Verify: all files from Tasks 1–5
- Update: `.superpowers/sdd/2026-11-12-istrazivaci-naseg-svijeta/progress.md`

**Interfaces:**
- Consumes: Task 5 public artifacts.
- Produces: a live fourth app and verified public portal.

- [ ] **Step 1: Run fresh verification**

Run: `cd istrazivaci-naseg-svijeta && npm run check`

Expected: zero failures. Record SHA-256 for `dist/index.html` and its public copy and assert equality.

- [ ] **Step 2: Perform one fresh-context final review**

Review against the spec and Review Focus for correctness, Croatian pedagogy, accessibility, storage safety and preservation of existing apps. Fix Important/Critical findings in one TDD pass; record Minor deferrals.

- [ ] **Step 3: Sync final files to GitHub `main`**

Create one final tree/commit on `dtornjanski/aplikacije-za-ucenje`, using a lease against the inspected current head.

- [ ] **Step 4: Publish on Render**

Allow the connected service `srv-dbppgk56e07s73b2ua3g` to auto-deploy the new commit. If no deploy appears after a reasonable webhook wait, trigger one manual deploy without clearing cache and monitor it to `live`.

- [ ] **Step 5: Verify production**

Fetch the portal and all four explicit routes with a cache-busting query. Assert HTTP success, four portal links, existing app availability, and exact SHA-256 equality between the downloaded new app and the tested local artifact.
