# Classwork checklist — every requirement and where it is implemented

Legend: ✅ implemented · 🟡 implemented with a noted limitation · ⏳ pending (see note)

## 1. Store concept, audience, purpose

| Requirement | Where | Status |
|---|---|---|
| What we sell (assessments, account protection, awareness, consultations, ongoing reviews) | Hero paragraph (`#home`), Service catalog (`#catalog`), About the Brand (`#about-brand`) | ✅ |
| Who we serve — small businesses, websites, online stores (primary); individuals (secondary) | Hero copy, catalog audience switch Business / Personal, Individuals section (`#personal`) | ✅ |
| Why choose us — clear scopes, deliverables, practical guidance, easy selection | Hero value points, every service's Scope / Not included / Deliverables (details dialog), About the Brand | ✅ |
| Store concept & target audience explained for review | `#about-brand` + [BRAND_GUIDE.md](BRAND_GUIDE.md) | ✅ |

## 2. Brand identity

| Requirement | Where | Status |
|---|---|---|
| Brand name SHADOW GATE | Everywhere; lockup in nav, footer, welcome | ✅ |
| Original logo (gateway + abstract S), works as favicon | `src/brand/Logo.tsx`, `public/favicon.svg`, `public/brand/*.svg`; shown at 16/32/64 px in `#about-brand` | ✅ |
| 2–3 core colours: Midnight navy #070B14, Electric teal #35F2C4, Soft white #F3F6FA (+ red only for threats) | `src/styles/tokens.css`, swatches in `#about-brand` | ✅ |
| Typography: Manrope (EN), Tajawal (AR), JetBrains Mono (telemetry only) | `tokens.css`, `main.tsx` (Fontsource, self-hosted) | ✅ |
| Three personality words: Vigilant · Precise · Approachable | `#about-brand`, BRAND_GUIDE | ✅ |
| Visual style (dark architecture, metallic gate, teal light, particles, fine grid) | 3D world (`src/three/*`), BRAND_GUIDE | ✅ |
| Slogan EN “Your gateway to a safer digital world.” + AR “حمايتك تبدأ من هنا” | Hero, footer, About the Brand, ad end card | ✅ |

## 3. Website structure

| Requirement | Where | Status |
|---|---|---|
| Full-screen interactive welcome page (logo, closed 3D gate, fog, particles, pointer camera, headline, Enter, direct link, sound muted by default) | `src/sections/Welcome/*`, `src/three/Gate.tsx`, `Atmosphere.tsx`, `ParticleField.tsx`, `CameraRig.tsx` | ✅ |
| Enter: light traces edges → gate opens → camera passes through → flows into site | `ENTRY_PHASES` in `src/three/worldLayout.ts`; entrance in `Welcome.tsx` | ✅ |
| Shown once per session (sessionStorage) / direct link bypasses / reduced-motion + no-WebGL fallback / never trapped | `state/experience.ts` (`sg-entered`), `StaticGate.tsx`, `?intro=` | ✅ |
| Persistent navigation: Home / Business Services / Personal Services / Threat Radar / Packages / Contact + “Request a Security Assessment” CTA | `src/components/layout/Nav.tsx` | ✅ |
| Hero with headline, short paragraph, “Protect My Business” + “Explore Services” | `src/sections/Hero/*` | ✅ |
| Service catalog with product cards + clear CTAs | `src/sections/Catalog/*` | ✅ |
| Responsive layouts (desktop, tablet, mobile) | All sections; verified 1440 / 768 / 390 px | ✅ |

## 4. Scroll-driven storytelling (Scenes A–F)

| Scene | Where | Status |
|---|---|---|
| A — Hero continues the world from the entrance | `#home` + camera key T=0 | ✅ |
| B — Particles reorganise into a 3D globe; threat arcs, event graph, event feed, inspect & filter | `#radar`, `ParticleField.tsx`, `ThreatArcs.tsx`, `src/sections/Radar/*` | ✅ |
| C — Camera to a company network; layers around website / email / cloud / account nodes, each tied to a service | `#layers`, `DefenseNetwork.tsx`, `src/sections/Layers/*` | ✅ |
| D — Service constellation: scroll changes focus, click opens details, bounded drag-to-rotate | `#explore`, `ServiceConstellation.tsx`, `src/sections/Constellation/*` | ✅ |
| E — Build Your Protection: request summary + symbolic structure that completes as services are added | `#build`, `BuildStructure.tsx`, `src/sections/Build/*` | ✅ |
| F — Individuals + contact, gate opens to a calm horizon | `#personal`, `#contact`, `HorizonGate.tsx` | ✅ |
| Scroll controls camera, position, rotation, scale, transitions and text; reverses on scroll-up | One timeline `T` (`src/lib/choreo.ts`) drives the camera and every scene as a pure function of scroll | ✅ |
| Not forced through a long sequence | Nav links, “Go directly to services”, “Skip to service catalog” links in every pinned scene | ✅ |
| 3D is never the only way to find a service | Accessible card catalog `#catalog`; hotspot buttons over 3D objects | ✅ |

## 5. Service catalog content

| Requirement | Where | Status |
|---|---|---|
| 8 business services + 4 personal services exactly as specified | `src/data/services.ts` | ✅ |
| Each: name, benefit, audience, scope & exclusions, deliverables, estimated duration, quote / illustrative pricing, View details, Add to request / Book a consultation | Cards + details dialog | ✅ |
| Pen testing requires ownership/authorization, quote-based | Service data, card/dialog notice, contact form authorization checkbox | ✅ |
| Monthly review is not 24/7 monitoring | Service exclusions + package comparison | ✅ |
| Packages Foundation / Business / Continuity Gate + comparison of real differences | `#packages`, `src/data/packages.ts` (`COMPARISON`) | ✅ |

## 6. Functional interactions (A–H) — at least three required, eight delivered

| # | Interaction | Where | Status |
|---|---|---|---|
| A | Audience + category filters | `#catalog` segmented control + chips | ✅ |
| B | Search with result count, clear control, empty state | `#catalog` search (`src/lib/search.ts`, Arabic-aware normalisation, unit-tested) | ✅ |
| C | Service details dialog (accessible, Escape, focus return) | `src/overlays/ServiceDetailsDialog.tsx` | ✅ |
| D | Request basket: add/remove, package, badge, summary, localStorage, no duplicates, undo | `state/basket.ts`, `state/actions.ts`, `overlays/BasketDrawer.tsx` | ✅ |
| E | 3-question recommendation quiz (guidance, not diagnosis) | `#quiz`, `src/lib/quiz.ts` (unit-tested) | ✅ |
| F | Threat radar: filters, select event, pause/resume; globe, graph, feed synchronised | `#radar`, `state/radar.ts`, `src/lib/threatSim.ts` | ✅ |
| G | Protection simulation (phishing / suspicious login), conceptual response + service, disclaimer | `#simulation` | ✅ |
| H | Request + booking forms: validation, field errors, confirmation with selected services, “Demo request saved in this browser. No message has been sent.” | `#contact`, `overlays/BookingDialog.tsx`, `src/lib/validation.ts` (unit-tested) | ✅ |

## 7. Threat radar rules

| Rule | Status |
|---|---|
| Locally generated simulated events, label “SIMULATED LIVE DEMO — NOT REAL THREAT INTELLIGENCE” | ✅ |
| Particle globe, animated arcs, rolling time-series graph, categories, details, filters, pause/resume | ✅ |
| Counters refer to simulated events; regions illustrative (not attribution); never claims to scan the visitor | ✅ |

## 8. Accessibility, language, motion

| Requirement | Where | Status |
|---|---|---|
| Heading hierarchy, contrast, visible focus, keyboard-operable nav/dialogs/forms/catalog, Escape closes, focus management | `base.css` focus styles, native `<dialog>`, skip link, `scrollToId` focuses headings | ✅ |
| Touch-friendly controls (≥ 44 px) | Button/chip tokens | ✅ |
| English default + working Arabic toggle (labels, forms, nav, service content, RTL layout) | `src/i18n/*` (Arabic type-checked against English), logical CSS | ✅ |
| prefers-reduced-motion + in-site motion toggle; static fallback without WebGL | `state/experience.ts`, `html[data-mode=static]`, `?static=1` | ✅ |
| Simplified mobile 3D | Quality tiers (DPR, particle counts, post-processing off on low) | ✅ |
| About the Brand section for review | `#about-brand` | ✅ |

## 9. Technical

| Requirement | Where | Status |
|---|---|---|
| React + TypeScript + Vite, three.js via R3F + drei, GSAP ScrollTrigger, CSS | `package.json` | ✅ |
| One coordinated scroll model (Lenis → ScrollTrigger → timeline T), keyboard/touch/anchors/forms preserved | `src/lib/smoothScroll.ts` | ✅ |
| One reusable WebGL canvas, cleanup of listeners/loops/triggers | `src/three/Stage.tsx` | ✅ |
| Original procedural geometry; no missing assets; sources documented | `docs/REFERENCES.md`, README “Assets & licences” | ✅ |
| Essential UI before heavy assets (3D lazy-loaded chunk) | `App.tsx` `lazy(() => import('./three/Stage'))` | ✅ |

## 10. Bonus — 12-second AI advertisement

| Requirement | Where | Status |
|---|---|---|
| Hook → Product → Benefit → Brand → CTA, 12 s | `ad-package/01-storyboard.md` | ✅ |
| Google Flow prompts per shot, continuity, VO, sound design, overlays + timing, edit guide, 16:9 + 9:16, final check | `ad-package/02…09-*.md`, `overlays.json/.srt` | ✅ |
| Real logo/typography added in edit (not by the video model) | `ad-package/assets/*` | ✅ |
| Rendered video | `ad-package/render/*.mp4` — rendered from the site’s own 3D world with the real logo and an original synthesised soundtrack (not a Google Flow generation; Flow prompts remain ready to use) | see `ad-package/README.md` |

## 11. Deliverables

1. Website source — this repository ✅
2. Logo + favicon — `public/favicon.svg`, `public/brand/` ✅
3. Brand guide — [docs/BRAND_GUIDE.md](BRAND_GUIDE.md) ✅
4. README with setup/run — [README.md](../README.md) ✅
5. This checklist ✅
6. Ad package — [ad-package/](../ad-package/README.md) ✅
7. Demo vs backend note — [docs/DEMO_VS_BACKEND.md](DEMO_VS_BACKEND.md) ✅
