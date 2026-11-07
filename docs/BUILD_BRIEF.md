# SHADOW GATE — Build brief for parallel builders

You are one of several agents building **SHADOW GATE**, a cinematic, scroll-driven cybersecurity service storefront
(classwork project). The foundation is already in place. Read this whole file before writing code.
Project root: `C:\Users\GAMING\ShadowGate-Storefront` (React 19 + TypeScript + Vite 7 + three 0.187 / R3F 9 / drei 10 /
@react-three/postprocessing 3 + GSAP 3.15 ScrollTrigger + Lenis + zustand 5 + lucide-react). No Tailwind — plain CSS.

## 1. What we are building
- **Sells:** cybersecurity assessments, account protection, security awareness, consultations, ongoing security reviews.
- **Audience:** primarily small businesses, company websites and online stores; secondarily individuals.
- **Why us:** understandable scopes, clear deliverables, practical guidance, easy service selection.
- **Journey:** enter (welcome gate) → explore (scroll story) → choose (catalog/quiz/packages) → interact (radar, simulation,
  basket) → receive feedback (toasts, summaries, confirmation states).
- **The defining behaviour:** scrolling drives camera movement, object position/rotation/scale, scene transitions and text
  choreography — not generic fade-ins. Scrolling backwards must reverse everything consistently.

## 2. Honesty rules (non-negotiable — reviewers will check)
- Never invent certifications, customer logos, testimonials, customer counts, statistics, or security guarantees.
  No "100% secure", "guaranteed", "trusted by X companies", "military-grade". Use "help", "reduce", "strengthen".
- Threat radar = locally generated simulation. Always show **"SIMULATED LIVE DEMO — NOT REAL THREAT INTELLIGENCE"**.
  Counters say "simulated events". Geographic points are illustrative, never attribution. Never claim to scan the visitor.
- Selecting services never "activates protection" — the Build scene is symbolic (say so).
- No backend: forms say exactly **"Demo request saved in this browser. No message has been sent."** Never pretend an
  email, booking, payment or scan happened. Booking flow = demo booking saved locally.
- Authorized Penetration Testing requires ownership or explicit authorization — state it wherever it can be chosen.
- Monthly Security Review is NOT a staffed 24/7 monitoring service.
- Durations are labelled estimates. Business pricing is quote-based; personal pricing is labelled
  "Illustrative classwork price".
- Simulations/quiz are guidance, not a security diagnosis; results depend on configuration and service scope.

## 3. Brand
- Name **SHADOW GATE** · Slogan "Your gateway to a safer digital world." · Arabic slogan "حمايتك تبدأ من هنا"
- Personality: **Vigilant. Precise. Approachable.** — calm authority, never fear-mongering.
- Palette: Midnight navy `#070B14` (bg), Electric teal `#35F2C4` (brand / protection / focus), Soft white `#F3F6FA` (text).
  Warning red `#FF4D5E` ONLY as a semantic threat indicator. Category hues for simulated threats: phishing `#FFB547`,
  suspicious login `#B99CFF`, automated scanning `#5CC8FF`, malicious traffic `#FF4D5E`.
- Type: Manrope (EN), Tajawal (AR, auto via `html[lang=ar]`), JetBrains Mono ONLY for small telemetry labels
  (`.telemetry`, `.eyebrow`). Body copy stays readable (muted ≥ #A9B4C4 on navy). Use glow selectively.
- Visual style: dark architectural environments, metallic gateway structures, controlled teal illumination, particles,
  subtle atmospheric depth, fine grid details, crisp typography. Mark = chamfered gateway frame + angular "S" path
  (`src/brand/Logo.tsx`, `MARK_FRAME`/`MARK_S` paths reusable in SVG art and 3D).

## 4. Reference study (already inspected — apply principles, copy nothing)
- **Genesis FX:** hero particle sphere that, on scroll, becomes a dotted-land globe; stats/info float around a continuing scene.
- **LOOT:** floating pill nav with scroll-% indicator; giant centre word pinned while particles/objects orbit it; glowing-edge
  glass cards with "01/03" counters; scroll controls proximity and transformation.
- **Noddal:** short loader → monumental glowing structure in a dramatic environment; camera flies INTO a light tunnel;
  central illumination; depth.
- **Hamol:** vertical orbit line of faceted metallic objects; scroll changes the focused object ("SELECTED WORK / 02",
  "02 / 09" counter); hint "Scroll to explore · Drag to rotate · Click to open"; left contextual panel updates.
- **21st.dev patterns (re-implemented natively, no paid code):** pointer spotlight card (`.card` uses `--mx/--my`),
  animated travelling border (`.glow-border`), laser sweep (`.scan-sweep`), glowing stat cards.
- **NameThatUI vocabulary:** sticky scrollytelling, stacking cards, segmented control, chips, drawer, coach marks, toast,
  empty state, live region, result count.

## 5. Architecture & contracts (do not break these)
| Concern | Where | Notes |
|---|---|---|
| Tokens / primitives | `src/styles/tokens.css`, `src/styles/base.css` | Reuse `.btn(--primary/--secondary/--ghost/--sm/--lg/--icon/--block)`, `.chip`, `.segmented`, `.card`, `.panel`, `.badge(--teal/--threat/--demo)`, `.field/.input/.textarea/.select/.check`, `.eyebrow`, `.display`, `.h2`, `.h3`, `.lead`, `.telemetry`, `.list-check`, `.container`, `.section`, `.section-head`, `.scrolly`/`.scrolly__pin`, `.sr-only`. |
| i18n | `src/i18n/index.ts` | `const { t, loc, locList, lang, isAr } = useI18n()`. `t('ns.key', {vars})`. Non-hook: `translate()`. **No hard-coded UI strings.** You own your namespace files `src/i18n/locales/en/<ns>.ts` + `ar/<ns>.ts` (Arabic typed against English — must have identical keys). Flat keys, `{placeholder}` interpolation. Arabic must be natural Modern Standard Arabic. Common words live in `common` / `nav` (read-only for you). |
| Content | `src/data/services.ts`, `packages.ts`, `categories.ts`, `types.ts` | `getService(id)`, `servicesFor(audience)`, `BUSINESS_SERVICE_IDS`, `getPackage`, `PACKAGES`, `COMPARISON`, `CATEGORIES`. Text is `L10n` → render with `loc(service.name)`. The content agent is filling copy right now — never hard-code service copy. |
| Basket | `src/state/basket.ts` + `src/state/actions.ts` | ALWAYS use `addServiceToRequest(id)`, `removeServiceFromRequest(id)`, `selectPackage(id\|null)`, `runPrimaryAction(id)` (consistent toasts + undo). Read with `useBasket(s => …)`, `packageCovers(pkg, id)`, `useBasketCount()`. |
| Overlays | `src/state/ui.ts` | `useUI.getState().openDetails(id)`, `openBasket()`, `openBooking(id)`, `toast({...})`. Overlays are mounted once in `App.tsx`. Build every modal with `src/components/ui/Dialog.tsx` (`Dialog` + `DialogClose`) — native `<dialog>`, Escape, focus return, scroll lock. |
| Catalog filters | `src/state/catalog.ts` | `useCatalog` (audience, category, query). |
| Experience mode | `src/state/experience.ts` | `mode: 'cinematic' \| 'static'` (static = no WebGL or reduced motion; also `html[data-mode]`), `reducedMotion`, `quality: high/medium/low`, `welcome: visible/entering/hidden`, `sceneReady`, `soundOn`. **Every cinematic section must render a meaningful static version** when `mode === 'static'` (no scroll-scrubbed motion, content as readable list/cards + static SVG art). CSS: `.scrolly` collapses to auto height in static mode. |
| Scroll model | `src/lib/choreo.ts`, `src/lib/smoothScroll.ts`, `src/lib/useSectionProgress.ts` | One model: Lenis (cinematic wheel smoothing) → ScrollTrigger → `scrollState.T` (world timeline, piecewise-linear from DOM anchors). Section ids: `SECTION_IDS`. Sticky heights: `SCROLLY_HEIGHT`. DOM choreography: `useSectionProgress(ref, p => …)` (no re-render) or `useSectionStep(ref, p => step)` (re-render on step change), or GSAP timelines with `scrollTrigger: { scrub: true }` created inside `useEffect`/`gsap.context` and reverted on cleanup. Helpers: `activeLayerIndex`, `layerReveal`, `constellationFocusIndex/Float`, `range`, `smoothstep`. Navigation: `scrollToId(id)` (moves focus to the section heading). After layout changes call `scheduleRefresh()`. |
| 3D | `src/three/*` | ONE canvas (`Stage.tsx`, lazy) fixed behind the page, `pointer-events: none`. Read `scrollState` (`src/state/scroll.ts`: `T`, `entry`, `pointerX/Y`) inside `useFrame` — never React state per frame. World anchors + camera keys: `src/three/worldLayout.ts` (`WORLD`, `constellationItemPos`, `CAM_KEYS`, `ENTRY_PHASES`). Hex colours: `src/brand/brand.ts` `COLORS`. Screen-space hotspots for DOM buttons: `src/state/projection.ts`. Hide groups (`visible = false`) when far from their T range. |
| Radar data | `src/state/radar.ts` | `useRadar` (events newest-first, filters, paused, selectedId, totals), `visibleEvents()`, `THREAT_CATEGORIES`, `CATEGORY_COLOR_VAR`. Geo: `src/lib/geo.ts` (`REGIONS`, `HOME_REGION`, `latLonToVec3`, `fibonacciDots`, `isLand`, `slerpLatLon`). |
| Storage | `src/lib/storage.ts` | `KEYS`, `readJSON/writeJSON/readString/writeString` (safe in private mode). |

Page order (all `<section id>` already stubbed in `App.tsx`): `home` (hero) → `radar` (sticky) → `layers` (sticky) →
`simulation` → `explore` (constellation, sticky) → `catalog` → `quiz` → `packages` → `build` (sticky) → `personal` →
`contact` → `about-brand` → footer. Keep your section's root element id, and keep `className="scrolly"` + the
`--scrolly-h` style for sticky sections (use `SCROLLY_HEIGHT`, mobile values under 820px).

T timeline (from `choreo.ts`): 0 hero · 0→1 core→globe morph · 1→2.6 radar · 2.6→3 travel · 3→5 layers ·
5→5.5 travel · 5.5→7.5 constellation · 7.5→8.5 parked/dimmed (catalog/quiz/packages) · 8.5→9 build · 9→10 personal+contact.

## 6. Quality bar
- **Accessibility:** semantic HTML, one `h1` (hero) then `h2` per section, `h3` inside. Every control keyboard-operable with
  visible focus. Toggle buttons use `aria-pressed`; radio-like groups use real radios or `role="radiogroup"`. Live
  results use `aria-live="polite"`. Decorative SVG/3D `aria-hidden`. Touch targets ≥ 44px. Contrast ≥ 4.5:1 for text.
  Never rely on colour alone (pair hue with text/icon).
- **RTL:** use logical CSS (`margin-inline-start`, `inset-inline-end`, `text-align: start`), never left/right for layout.
  Mirror directional icons with `.icon-flip`. Check your section with `?lang=ar`.
- **Responsive:** 360px → 1920px. No horizontal overflow. Sticky sections must fit 100svh on phones (simplify / stack).
- **Motion:** respect `reducedMotion` (no autoplay motion, instant state changes). Clean up every listener, rAF, timer,
  ScrollTrigger and GSAP tween on unmount.
- **Performance:** no per-frame React state; no layout thrash in scroll handlers; lazy work only when the section is near
  the viewport (IntersectionObserver).
- **Style:** dark glass panels over the 3D world, teal for protection/selection, mono telemetry details sparingly
  (e.g. `SG//RADAR 02`, `LAYER 03 / 05`). Co-locate CSS as `Component.css` imported by the component; prefix class names
  with your area (`radar-…`, `cat-…`, `pkg-…`) to avoid collisions. Match the existing code style (2-space, single quotes,
  short purposeful comments).

## 7. Rules of engagement
- Edit ONLY the files your assignment lists (plus new files inside your own folders). If you need a change elsewhere
  (`App.tsx`, `Nav`, `base.css`, stores, `choreo.ts`, `Dialog`, another agent's section) do NOT make it — describe it under
  `integrationRequests` in your final report. Additive edits explicitly allowed in your assignment are the exception.
- Do not install packages, do not run `vite build`, do not `git commit`. Use only installed dependencies.
- Verify your work: `npx tsc -b --pretty false` must pass for your files (ignore errors clearly caused by another agent's
  in-progress file — mention them). Put pure logic in `src/lib/*.ts` with Vitest tests (`src/**/*.test.ts`,
  run `npx vitest run <path>`).
- Visual QA: start your OWN dev server on your assigned port in the background:
  `node node_modules/vite/bin/vite.js --port <PORT> --strictPort` (run_in_background), then
  `node scripts/shot.mjs --url "http://localhost:<PORT>/?intro=0" --at <section-id>[:fraction] --out shots/<you>/name`
  (`--mobile --width 390 --height 844`, `?lang=ar`, `?static=1`, `--reduced`, `?intro=1` for the welcome page,
  `--click "<selector>"`). Read the PNGs to check your work and the printed console errors. Iterate until it looks
  premium. Stop your dev server when finished (`netstat -ano | grep :<PORT>` → `taskkill //PID <pid> //F`).
- Other sections are placeholders while everyone builds in parallel — that is expected.
- Final report: what you built, files, how you verified (screenshots taken), known gaps, integration requests.
