# Informatička pustolovina Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Izraditi, testirati i objaviti treću javnu aplikaciju za cjelogodišnje uvježbavanje informatike u drugom razredu osnovne škole.

**Architecture:** Izvor je mali statički projekt podijeljen na čisti engine, deklarativnu banku sadržaja, UI kontroler i stilove. Build skripta ih spaja u jednu samostalnu HTML datoteku bez vanjskih ovisnosti te je postavlja u postojeći `javne-aplikacije` paket; testovi izravno provjeravaju engine i cijeli korisnički tok u JSDOM-u.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript (UMD/CommonJS kompatibilan engine), Node.js test runner, JSDOM 26.1.0, SVG/CSS ilustracije, Render Static Site.

**Spec:** `docs/superpowers/specs/2026-11-12-informaticka-pustolovina-design.md`

## Global Constraints

- Sav sadržaj mora biti originalan; ne kopirati stranice, zadatke, formulacije, ilustracije ni zaštićeno sučelje knjige ili Scratcha.
- Pokriti osam odobrenih svjetova, tri razine i najmanje 12 predložaka po kombinaciji svijeta i razine, ukupno najmanje 288.
- Svijet pokreće rundu od 5 zadataka; miješana vježba pokreće 8 zadataka, po jedan iz svakog svijeta.
- Ne prikazivati pomoć, rješenje, točan odgovor nakon pogreške, školsku ocjenu, odbrojavanje ili negativne bodove.
- Nakon provjere prikazati samo `Točno!` ili `Pogledaj još jednom.`; netočan odgovor ostaje na istom zadatku.
- Sve interakcije moraju raditi mišem, tipkovnicom i dodirom bez obveznog povlačenja.
- Ne prikupljati osobne podatke, ne koristiti analitiku, račune, oglase, vanjske API-je, fontove, biblioteke ili mrežne zahtjeve nakon učitavanja.
- Konačna aplikacija mora biti jedna samostalna HTML datoteka i raditi u aktualnom Chromeu na desktopu, tabletu i mobitelu.
- Sačuvati napredak u `localStorage`; nedostupan ili oštećen storage ne smije spriječiti vježbanje.
- Ne mijenjati ponašanje postojećih aplikacija `matematicka-pustolovina` i `mislim-i-otkrivam`.

## Review Focus

- Oštećen, zastario ili ručno izmijenjen spremljeni napredak mora se ignorirati bez rušenja aplikacije — Task 3 testira validaciju sheme i nastavak rada bez storagea.
- Pitanje s promiješanim karticama mora zadržati isti točan odgovor i nakon ponovnog učitavanja — Task 2 testira deterministički generator, Task 3 deterministički resume.
- Klik/dodir na karticu ne smije dopustiti nepotpun odgovor ili slučajno dvostruko dodjeljivanje — Task 4 testira svaki interakcijski tip i zaključavanje provjerenog odgovora.
- Hrvatski dijakritički znakovi, dugi naslovi i 320 px širina ne smiju prekriti kontrole — Task 5 testira strukturu, responsive CSS i odsutnost horizontalnog overflowa.
- Objava ne smije posluživati zastarjelu početnu stranicu ili pogrešnu putanju — Task 6 provjerava eksplicitne `index.html` URL-ove, HTTP 200 i SHA-256 podudaranje.

---

## File Structure

- `informaticka-pustolovina/package.json` — razvojne naredbe i JSDOM testna ovisnost.
- `informaticka-pustolovina/src/engine.js` — seeded random, provjera odgovora, sesija, rezultati i validacija spremljenog stanja.
- `informaticka-pustolovina/src/content.js` — osam svjetova, tri razine i deklarativni predlošci/factory funkcije.
- `informaticka-pustolovina/src/app.js` — navigacija, renderiranje ekrana, interakcije i storage adapter.
- `informaticka-pustolovina/src/styles.css` — responsive, pristupačan vizualni sustav i animacije.
- `informaticka-pustolovina/src/index.html` — semantička ljuska aplikacije.
- `informaticka-pustolovina/scripts/build.cjs` — validacija izvora i spajanje u jednu HTML datoteku.
- `informaticka-pustolovina/dist/index.html` — generirani samostalni artefakt.
- `informaticka-pustolovina/tests/engine.test.cjs` — sadržaj, generator, provjera i sesija.
- `informaticka-pustolovina/tests/ui.test.cjs` — korisnički tokovi, storage i pristupačnost.
- `build-page-apps.mjs` — dodavanje treće aplikacije u zajednički build i početnu stranicu.
- `javne-aplikacije/informaticka-pustolovina/index.html` — javna Render datoteka.
- `javne-aplikacije/index.html` — treća kartica i eksplicitne `index.html` putanje za sve aplikacije.

### Task 1: Engine contract and answer validation

**Files:**
- Create: `informaticka-pustolovina/package.json`
- Create: `informaticka-pustolovina/src/engine.js`
- Create: `informaticka-pustolovina/tests/engine.test.cjs`

**Interfaces:**
- Produces: `InfoEngine.makeRng(seed)`, `InfoEngine.shuffle(values, rng)`, `InfoEngine.check(question, response)`, `InfoEngine.createSession(level, world, seed, questions)`, `InfoEngine.submit(session, response)`, `InfoEngine.summarize(session)`, `InfoEngine.restore(raw, buildRound)`.
- Question response shapes: `single/debug/sim -> {selected:string}`, `match -> {pairs:Array<[string,string]>}`, `sort -> {zones:Record<string,string[]>}`, `order -> {items:string[]}`.

- [ ] **Step 1: Write failing tests for all six response types**

Add named tests asserting exact acceptance of the correct response, rejection of empty/partial/duplicate/wrong responses, order-insensitive pair and zone comparison, and order-sensitive sequence comparison.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `cd informaticka-pustolovina && npm test -- --test-name-pattern="response"`

Expected: FAIL because `src/engine.js` does not exist.

- [ ] **Step 3: Implement the pure answer-validation contract**

Implement the exported signatures above without DOM or storage access. Normalize only whitespace and Croatian string case; never accept partial identifiers.

- [ ] **Step 4: Add and pass session transition tests**

Assert `empty`, `incorrect`, `correct`, `locked`, attempt counts, five-question world summaries, and eight-question mixed summaries.

Run: `cd informaticka-pustolovina && npm test`

Expected: all Task 1 tests PASS.

- [ ] **Step 5: Commit the engine checkpoint**

Commit message: `feat: add informatics practice engine`

### Task 2: Curriculum-aligned content bank and deterministic rounds

**Files:**
- Create: `informaticka-pustolovina/src/content.js`
- Modify: `informaticka-pustolovina/tests/engine.test.cjs`

**Interfaces:**
- Consumes: `InfoEngine.makeRng(seed)`, `InfoEngine.shuffle(values, rng)`.
- Produces: `InfoContent.worlds`, `InfoContent.levels`, `InfoContent.templateCount()`, `InfoContent.buildRound(level, world, seed)`.
- `buildRound` returns 5 unique questions for a world and 8 questions for `world === 'mix'`, with stable IDs and response contracts from Task 1.

- [ ] **Step 1: Write failing coverage and determinism tests**

Assert exactly 8 world IDs, 3 level IDs, at least 12 templates per world/level, total `templateCount() >= 288`, 5 unique world questions, 8 mixed questions covering all worlds, same seed equality, different seed inequality, and no `undefined`/`NaN` content.

- [ ] **Step 2: Run tests and verify the missing content module failure**

Run: `cd informaticka-pustolovina && npm test -- --test-name-pattern="content|round"`

Expected: FAIL because `InfoContent` is missing.

- [ ] **Step 3: Implement worlds and templates**

Create the eight approved worlds and a declarative matrix of 12 scenario templates per world/level. Use shared generic factories only where the generated question still differs in cognitive demand across `easy`, `medium`, and `hard`.

- [ ] **Step 4: Add exhaustive generated-question validation**

For seeds 1–100 across all 24 world/level pairs and all three mixed levels, assert valid IDs, known type, complete options/items/zones, a solvable answer, strict rejection of a constructed wrong answer, no duplicate displayed choices, and no copied publisher/brand phrases.

- [ ] **Step 5: Run the full engine suite**

Run: `cd informaticka-pustolovina && npm test`

Expected: PASS with at least 2,400 generated world rounds plus 300 mixed rounds checked.

- [ ] **Step 6: Commit the content checkpoint**

Commit message: `feat: add full-year informatics question bank`

### Task 3: Persistence and safe resume

**Files:**
- Modify: `informaticka-pustolovina/src/engine.js`
- Modify: `informaticka-pustolovina/tests/engine.test.cjs`

**Interfaces:**
- Consumes: `InfoContent.buildRound(level, world, seed)`.
- Produces: validated schema version `info-adventure-session-v1` through `InfoEngine.serialize(session)` and `InfoEngine.restore(raw, InfoContent.buildRound)`.

- [ ] **Step 1: Write failing restore tests**

Assert round-trip persistence after one solved question, identical shuffled question after restore, and rejection of bad JSON, wrong version, unknown level/world, invalid index, mismatched array lengths, injected response values and impossible solved state.

- [ ] **Step 2: Run and verify failures**

Run: `cd informaticka-pustolovina && npm test -- --test-name-pattern="restore|persist"`

Expected: FAIL on missing or incomplete serialization methods.

- [ ] **Step 3: Implement schema validation and reconstruction**

Persist only seed, selection, progress, attempts, solved flags and current responses; reconstruct question content from the deterministic generator and reject any state that does not match it.

- [ ] **Step 4: Run the engine suite**

Run: `cd informaticka-pustolovina && npm test`

Expected: PASS.

- [ ] **Step 5: Commit the persistence checkpoint**

Commit message: `feat: add safe informatics session resume`

### Task 4: Accessible multi-interaction interface

**Files:**
- Create: `informaticka-pustolovina/src/index.html`
- Create: `informaticka-pustolovina/src/app.js`
- Create: `informaticka-pustolovina/src/styles.css`
- Create: `informaticka-pustolovina/tests/ui.test.cjs`

**Interfaces:**
- Consumes: all Task 1–3 browser globals and response shapes.
- Produces: DOM actions `home`, `level`, `world`, `check`, `retry`, `next`, `resume`, `new-round`; storage key `info-adventure-session-v1`.

- [ ] **Step 1: Write the failing home/topic/navigation test**

Assert title, Bitko, three levels, eight worlds, mixed practice, no help/solution text, explicit grade label, focus movement and a disabled `Provjeri` button before a complete response.

- [ ] **Step 2: Run and verify the UI test fails**

Run: `cd informaticka-pustolovina && npm test -- --test-name-pattern="navigation"`

Expected: FAIL because the UI files do not exist.

- [ ] **Step 3: Implement semantic screen rendering and storage adapter**

Use one `<main tabindex="-1">`, event delegation, `<button>` controls, `aria-live="polite"` feedback and try/catch around every storage read/write.

- [ ] **Step 4: Write and implement six interaction renderers**

Add one test per `single`, `match`, `sort`, `order`, `debug`, and `sim`: complete an answer using click events only, verify enablement, submit wrong once, retry correctly, lock the solved response, and advance.

- [ ] **Step 5: Add complete-round and resume UI tests**

Exercise all 24 world/level selections plus all three mixed selections; verify summary counts, new seed on repetition, reload resume, corrupt-save fallback and operation with blocked `localStorage`.

- [ ] **Step 6: Implement responsive visual system**

Use the approved palette, CSS/SVG Bitko, 44 px minimum targets, visible focus, 320 px breakpoint, high-contrast text and `prefers-reduced-motion`.

- [ ] **Step 7: Run all local tests**

Run: `cd informaticka-pustolovina && npm test`

Expected: PASS with no JSDOM errors and no forbidden help/solution controls.

- [ ] **Step 8: Commit the interface checkpoint**

Commit message: `feat: build interactive informatics adventure UI`

### Task 5: Self-contained build and portal integration

**Files:**
- Create: `informaticka-pustolovina/scripts/build.cjs`
- Create: `informaticka-pustolovina/dist/index.html`
- Modify: `informaticka-pustolovina/package.json`
- Modify: `build-page-apps.mjs`
- Create: `page-apps/informaticka-pustolovina.html`
- Create: `javne-aplikacije/informaticka-pustolovina/index.html`
- Modify: `javne-aplikacije/index.html`
- Modify: `informaticka-pustolovina/tests/ui.test.cjs`

**Interfaces:**
- Consumes: source files from Tasks 1–4.
- Produces: `npm run build`, one standalone `dist/index.html`, one public copy, third portal card and explicit `*/index.html` links.

- [ ] **Step 1: Write failing build-artifact tests**

Assert one HTML file contains embedded CSS, engine, content and app; contains no `http:`, `https:`, external `src`/`href`, source map, publisher assets or runtime fetch; size remains below 256 KiB.

- [ ] **Step 2: Implement the bundler and package scripts**

Add `build`, `test` and `check` scripts. Build validates JavaScript with `new Function`, escapes literal `</script>` in embedded data and writes UTF-8 output.

- [ ] **Step 3: Extend the shared site builder**

Teach `build-page-apps.mjs` to include the new fragment/public HTML, render three responsive portal cards, and use `matematicka-pustolovina/index.html`, `mislim-i-otkrivam/index.html`, and `informaticka-pustolovina/index.html` explicitly.

- [ ] **Step 4: Run build and full verification**

Run: `cd informaticka-pustolovina && npm run check && cd .. && node build-page-apps.mjs`

Expected: all tests PASS; all three public HTML files exist; portal contains exactly three cards; no existing app hash changes except the intentional rebuilt wrapper when byte-identical source produces the same content.

- [ ] **Step 5: Perform local responsive smoke checks**

Verify home, each interaction type, incorrect retry and results at 320×700, 768×1024 and 1440×900; confirm no horizontal scrollbar and keyboard-only completion.

- [ ] **Step 6: Commit the build checkpoint**

Commit message: `feat: integrate informatics adventure into learning portal`

### Task 6: Repository sync, Render deployment and production verification

**Files:**
- Sync: `informaticka-pustolovina/**`
- Sync: `build-page-apps.mjs`
- Sync: `page-apps/informaticka-pustolovina.html`
- Sync: `javne-aplikacije/index.html`
- Sync: `javne-aplikacije/informaticka-pustolovina/index.html`

**Interfaces:**
- Consumes: completed Task 5 artifacts.
- Produces: GitHub commit on `dtornjanski/aplikacije-za-ucenje`, Render deploy for service `srv-dbppgk56e07s73b2ua3g`, public URL `/informaticka-pustolovina/index.html`.

- [ ] **Step 1: Run pre-deploy verification**

Run: `cd informaticka-pustolovina && npm run check && cd .. && shasum -a 256 javne-aplikacije/*/index.html javne-aplikacije/index.html`

Expected: PASS and four SHA-256 values recorded.

- [ ] **Step 2: Sync only intended files to GitHub**

Create/update files on branch `main`; fetch the current blob SHA before every update and do not modify unrelated Render or GitHub projects.

- [ ] **Step 3: Trigger and monitor the Render deploy**

Trigger one deploy for service `srv-dbppgk56e07s73b2ua3g`; capture the deploy ID and wait for terminal status `live`.

- [ ] **Step 4: Verify all production routes**

Request the portal and all three explicit `index.html` URLs with cache-busting query strings. Expect HTTP 200 and exact byte/hash match for each HTML file.

- [ ] **Step 5: Verify production behavior**

Load the new application in Chrome, start one easy and one hard round, complete at least one `sort` and one `order` task, confirm incorrect retry behavior and refresh/resume.

- [ ] **Step 6: Record the release**

Commit message: `release: publish informatics adventure`

Provide the portal URL, direct application URL, deploy status and test summary.

