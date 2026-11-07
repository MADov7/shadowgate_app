# SHADOW GATE — References and sources

What we studied, which principles we adapted and where, and where every asset comes from.

> **Nothing was copied.** No logos, text, images, 3D models, shaders, code or other assets were taken from any
> reference site. The references were studied for *principles* — pacing, hierarchy, interaction patterns — and
> every part of Shadow Gate was designed and built from scratch for this project.

## 1. Sites studied

| Reference | What we observed | Principle adapted | Where in Shadow Gate |
|---|---|---|---|
| **Genesis FX** | A hero particle sphere that, on scroll, becomes a dotted-land globe; stats and info float around a scene that keeps going instead of cutting to new pages | One continuous 3D world that transforms with scroll; information floats *over* the scene | Hero particle core → dotted globe morph (world timeline T 0 → 1); the simulated threat radar on the globe (`#radar`) with glass panels around it |
| **LOOT** | Floating pill navigation with a scroll-percentage indicator; a giant centre word pinned while particles/objects orbit it; glowing-edge glass cards with "01/03" counters; scroll controls proximity and transformation | Constant orientation (where am I, how far); pinned sticky scenes; counters as wayfinding; edge light on cards | Pill nav with live scroll % (`Nav.tsx`); pinned sticky sections (`.scrolly`) for radar, layers, constellation and build; "LAYER 03 / 05" style counters; glowing-border glass cards in Catalog and Packages |
| **Noddal** | A short loader leading to a monumental glowing structure in a dramatic environment; the camera flies *into* a light tunnel; central illumination and depth | A threshold moment: arrive, see one monumental object, pass through it | The welcome gate and its entry phases (trace → open → fly through, `ENTRY_PHASES` in `worldLayout.ts`); the horizon gate near the end of the page; the gateway beats of the 12 s ad |
| **Hamol** | A vertical orbit of faceted metallic objects; scroll changes the focused object ("SELECTED WORK / 02", "02 / 09"); hint line "Scroll to explore · Drag to rotate · Click to open"; a contextual panel that updates with the focus | Scroll as a selector; one focused item at a time with a counter and a context panel; an explicit hint for the three interactions | The service constellation (`#explore`): scroll focuses one service at a time, "Service n / total" counter, a hint for scroll / drag / click (tap on touch), and a contextual details panel |

## 2. Pattern vocabulary (no code taken)

- **21st.dev** — used only as a vocabulary of component ideas, all re-implemented natively in plain CSS/React with no
  paid or copied code: pointer-spotlight card (`.card` with `--mx/--my`), animated travelling border
  (`.glow-border`), laser sweep (`.scan-sweep`), glowing stat cards.
- **NameThatUI** — used only to name patterns consistently while planning: sticky scrollytelling, stacking cards,
  segmented control, chips, drawer, coach marks, toast, empty state, live region, result count.

## 3. Asset sources

| Asset | Source | Licence |
|---|---|---|
| Logo, mark, favicon, wordmark | Original — drawn for Shadow Gate (`src/brand/Logo.tsx`, `public/brand/`) | Project's own |
| 3D world (gate, globe, network, constellation, build structure, horizon), particles, shaders, textures | Procedural / original code in `src/three/` | Project's own |
| Globe land dots | Natural Earth 1:110m land data via the `world-atlas` npm package, converted to a 1° land mask by `scripts/build-landmask.mjs` | Natural Earth: public domain · `world-atlas` package: ISC |
| Icons | lucide (`lucide-react`) | ISC |
| Fonts | Manrope, Tajawal, JetBrains Mono — self-hosted via Fontsource | SIL Open Font License 1.1 |
| Ad package graphics (`ad-package/assets/`) | Generated from the real logo paths and the fonts above by `ad-package/tools/build.mjs` | Project's own (fonts embedded under OFL 1.1) |
| Ad animatic and its temp sound sketch | Original SVG/CSS motion and Web Audio synthesis in `ad-package/animatic/index.html` | Project's own |
| Copy (EN and AR) | Written for this project | Project's own |

No stock photos, stock video, stock music, third-party 3D models or AI-generated imagery are used in the site.
The Google Flow footage described in `ad-package/` has not been generated; when it is, it will be original
footage made from the package's own prompts, without reference images from other brands.

## 4. Code libraries

React, React DOM, three.js, @react-three/fiber, @react-three/drei, @react-three/postprocessing / postprocessing,
Lenis, zustand, Vite, Vitest, Playwright, d3-geo and topojson-client are used as dependencies under their own
permissive open-source licences (MIT; ISC for d3-geo, topojson-client, lucide-react and world-atlas; Zlib for
postprocessing; Apache-2.0 for Playwright); GSAP and ScrollTrigger under GSAP's Standard "no charge" licence. No
library source was copied into the project.
