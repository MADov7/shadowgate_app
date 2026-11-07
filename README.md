# SHADOW GATE — cybersecurity service storefront

> *Your gateway to a safer digital world.* · *حمايتك تبدأ من هنا*

A cinematic, scroll-driven storefront for a (fictional, classwork) cybersecurity company. Visitors enter through a 3D
gateway, travel through a simulated threat radar, a company network that gains protection layers, and a constellation of
services — then choose services in an accessible catalog, compare packages, build a request and submit a demo form.
Businesses are the primary audience; individuals the secondary one. English and Arabic (RTL) are fully supported.

**Status:** classwork demo. No backend — see [docs/DEMO_VS_BACKEND.md](docs/DEMO_VS_BACKEND.md).

## Run it on Replit

1. Create a Repl → **Import** → upload this ZIP (or create a Node.js Repl and drag the extracted files in).
2. Press **Run**. The included `.replit` runs `npm run replit`: installs dependencies, builds the site and serves it on
   port 5000 (Replit shows it in the Webview).
3. To publish: **Deploy → Static**. The deployment builds with `npm run build:web` and serves the `dist/` folder.

## Run it locally

Requirements: Node.js 20.19+ (built and tested with Node 24) and npm.

```bash
npm install
```

```bash
npm run dev
```

Open the printed URL (default http://localhost:5173).

```bash
npm run build
```

```bash
npm run preview
```

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) + production build to `dist/` |
| `npm run preview` | Serve the production build on port 4173 |
| `npm test` | Unit tests (Vitest): search, quiz scoring, validation, threat simulation, data & i18n completeness |
| `npm run test:e2e` | End-to-end tests (Playwright, desktop + mobile, against the production build — run `npm run build` first) |
| `npm run landmask` | Regenerates the globe land mask from Natural Earth data (only needed if you change resolution) |
| `npm run shot -- --url … --at <section>` | Screenshot helper used for visual QA |

## Useful URL switches (testing & review)

| Switch | Effect |
|---|---|
| `?intro=1` / `?intro=0` | Force / skip the welcome gate (normally shown once per browser session) |
| `?static=1` or `?webgl=0` | Static experience — what visitors without WebGL get |
| `?motion=reduced` / `?motion=full` | Override `prefers-reduced-motion` (also toggle in the nav) |
| `?quality=low\|medium\|high` | Force a 3D quality tier |
| `?lang=ar` | Start in Arabic (RTL); the nav toggle switches live |
| `#catalog`, `#packages`, … | Deep links bypass the cinematic entrance |

## Project map

```
src/
  App.tsx                 page composition + scroll system bootstrap
  styles/                 tokens.css (brand tokens), base.css (shared UI primitives)
  brand/                  original SVG logo (Logo.tsx) + colour constants
  i18n/                   typed EN/AR dictionaries (Arabic is type-checked against English)
  data/                   services, packages, categories (bilingual content model)
  state/                  zustand stores: basket (persisted), ui overlays, catalog filters, radar, experience mode
  lib/                    choreo.ts (scroll → world timeline), smoothScroll.ts (Lenis + ScrollTrigger), geo, search,
                          quiz, validation, threat simulation, storage, capabilities
  three/                  the single WebGL scene: gate, particles→globe, threat arcs, network layers, constellation,
                          build structure, horizon gate, camera rig, post-processing
  sections/               Welcome, Hero, Radar, Layers, Simulation, Constellation, Catalog, Quiz, Packages, Build,
                          Personal, Contact, BrandAbout, Footer
  overlays/               service details dialog, basket drawer, booking dialog
docs/                     brand guide, classwork checklist, demo-vs-backend note, references, build brief
ad-package/               12-second AI advertisement production package (Google Flow) — render pending
e2e/                      Playwright tests
scripts/                  landmask generator, screenshot helper
```

## How the scroll story works

One coordinated scroll model: Lenis smooths wheel input (cinematic mode only) and drives GSAP ScrollTrigger. The page's
scroll position is mapped piecewise-linearly onto a continuous **world timeline `T`** using DOM anchors
(`src/lib/choreo.ts`). The 3D camera, particle morphs, protection layers and constellation focus are pure functions of
`T`, so scrolling backwards reverses every transition exactly. Sticky sections use CSS `position: sticky` (no pin
spacers), and DOM text choreography uses section-local ScrollTrigger progress.

Accessibility fallbacks: reduced motion or missing WebGL switches to a **static experience** (`html[data-mode=static]`):
no canvas, no scroll-scrubbed motion, every scene rendered as readable content with static SVG art. The 3D scene is
never the only way to find or select a service.

## Brand & classwork documents

- [docs/BRAND_GUIDE.md](docs/BRAND_GUIDE.md) — identity, logo, palette, typography, voice
- [docs/CLASSWORK_CHECKLIST.md](docs/CLASSWORK_CHECKLIST.md) — every assignment requirement mapped to where it is implemented
- [docs/DEMO_VS_BACKEND.md](docs/DEMO_VS_BACKEND.md) — what is simulated vs. what would need a backend
- [docs/REFERENCES.md](docs/REFERENCES.md) — reference-site study and asset sources
- [ad-package/README.md](ad-package/README.md) — 12-second advertisement package

## Assets & licences

All 3D geometry, particles, textures, sounds and the logo are procedural/original. Fonts: Manrope, Tajawal and JetBrains
Mono via Fontsource (SIL Open Font License). Icons: lucide (ISC). Globe land dots: Natural Earth 1:110m land (public
domain) via the `world-atlas` package, pre-baked into `src/lib/landmask.ts`.
