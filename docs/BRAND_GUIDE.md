# SHADOW GATE — Brand guide

Short reference for anyone designing, writing or producing for SHADOW GATE (classwork project). Source of truth
in code: `src/styles/tokens.css` (CSS), `src/brand/brand.ts` (JS/WebGL colours), `src/brand/Logo.tsx` (mark),
`public/brand/*.svg` (logo files).

## 1. Brand core

| | |
|---|---|
| **Name** | SHADOW GATE — always two words, set in capitals in the wordmark; "Shadow Gate" in running text |
| **Concept** | Cybersecurity as a gateway you pass through *with a guide*: a calm, architectural place where security becomes understandable. The shadow is the unknown risk; the gate is the guided way through it. |
| **Offer** | Security assessments, account protection, security awareness, consultations, ongoing security reviews |
| **Audience** | First: small businesses, company websites and online stores. Second: individuals and families |
| **Positioning** | Practical security help with understandable scopes, clear deliverables and easy service selection — security help that is as clear to choose as any other professional service |
| **Personality** | **Vigilant** (attentive to risk, never alarmist) · **Precise** (clear scopes, exact wording, honest limits) · **Approachable** (plain language, patient guidance) |
| **Slogan (EN)** | *Your gateway to a safer digital world.* |
| **Slogan (AR)** | *حمايتك تبدأ من هنا* ("Your protection starts here") — no final full stop |

## 2. Logo

### Construction
- **Mark** on a 64 × 64 grid, two strokes of width **5** (≈ 7.8 % of the grid), square caps, mitred joins:
  - Gateway frame — `M12 58V21L24.5 8.5h15L52 21v37`: open at the bottom, vertical legs, two 45° chamfers
    (12.5 × 12.5), a flat top 15 units wide. Colour: soft white `#F3F6FA`.
  - Angular **S** path — `M41 22.5H24.5v12h15v12H23`: three horizontals and two verticals, all right angles,
    running through the gate — the guided route. Colour: electric teal `#35F2C4`.
- **Wordmark:** Manrope 800, capitals, tracking 0.185 em; "SHADOW" soft white, "GATE" teal, a 0.37 em gap between
  them. Lockup file: `public/brand/shadow-gate-lockup.svg` (360 × 64; wordmark at x 72, baseline 43, 27 px).
- **Versions:** full colour (`shadow-gate-mark.svg`), single colour teal (`shadow-gate-mark-mono.svg`), horizontal
  lockup (`shadow-gate-lockup.svg`), stacked lockup (`ad-package/assets/shadow-gate-lockup-stacked.svg`), favicon
  (`public/favicon.svg`: the mark on a navy rounded square, radius 14/64).

### Clear space and minimum sizes
- **Clear space:** keep a margin of **¼ of the mark's height** on every side of the mark or lockup (16 units on the
  64 grid). Nothing — text, edges, other logos — enters it.
- **Minimum sizes:** mark **16 px** (favicon, always on its navy tile) · mark alone in UI ≥ 20 px · horizontal
  lockup ≥ 120 px wide on screen · print: mark ≥ 6 mm, lockup ≥ 30 mm wide.
- Two strokes with no fine detail keep the mark legible at 16 px; below that, do not use it.

### Backgrounds
- Preferred: midnight navy `#070B14` or the dark navy surfaces. On photographs or 3D, place it over a dark, calm
  area (add a navy scrim if needed).
- On light backgrounds use a single-colour midnight navy version. Never teal on white (contrast 1.3 : 1).

### Don'ts
- Don't redraw, trace, regenerate (AI) or re-letter the mark or wordmark — use the SVG files.
- Don't change stroke weights, round the corners, swap the two colours, or add a fill inside the gate.
- Don't rotate, skew, outline, bevel or add drop shadows/glows stronger than a soft ambient shadow.
- Don't use the threat red, gradients or category hues in the logo.
- Don't place it on busy, bright or mid-tone backgrounds without a scrim; don't crop it.
- Don't translate or transliterate the wordmark in the logo — it stays "SHADOW GATE" in Arabic contexts too.

## 3. Colour

Contrast ratios are WCAG 2.x relative-luminance ratios, computed from the hex values.

| Colour | Hex | RGB | Role | On navy `#070B14` | On navy-2 `#0E1628` | Text rating on navy |
|---|---|---|---|---|---|---|
| Midnight navy | `#070B14` | 7, 11, 20 | Background, depth | — | 1.09 | — |
| Navy 1 / 2 / 3 / 4 | `#0A1020` · `#0E1628` · `#142035` · `#1B2A44` | 10,16,32 · 14,22,40 · 20,32,53 · 27,42,68 | Elevation steps, panels, inputs | 1.04 · 1.09 · 1.21 · 1.37 | — | Surfaces only |
| Electric teal | `#35F2C4` | 53, 242, 196 | Brand, protection, selection, focus ring | **13.73** | 12.58 | AAA |
| Soft teal | `#8AF7DA` | 138, 247, 218 | Highlights, hover on teal | **15.37** | 14.09 | AAA |
| Soft white | `#F3F6FA` | 243, 246, 250 | Primary text | **18.16** | 16.64 | AAA |
| Muted slate | `#A9B4C4` | 169, 180, 196 | Secondary text | **9.38** | 8.60 | AAA |
| Faint slate | `#8592A5` | 133, 146, 165 | Tertiary text, captions | **6.23** | 5.71 | AA |
| Gunmetal | `#1C2638` | 28, 38, 56 | 3D metal, gateway structures | 1.30 | 1.19 | Never for text |
| Warning red | `#FF4D5E` | 255, 77, 94 | **Only** simulated threat indicators | **6.07** | 5.56 | AA |
| On-teal ink | `#04110D` | 4, 17, 13 | Text on teal buttons | — | — | 13.43 on teal (AAA) |

**Simulated threat categories** (radar and simulation only, always paired with a text label or icon):
phishing `#FFB547` (11.20 : 1 on navy) · suspicious login `#B99CFF` (8.68) · automated scanning `#5CC8FF` (10.46) ·
malicious traffic `#FF4D5E` (6.07).

Rules:
- Teal means protection, selection and focus — use it with intent, not as decoration everywhere.
- Red never decorates: it marks a *simulated* threat and nothing else. Never white text on red (2.99 : 1) and never
  white text on teal (1.32 : 1) — use on-teal ink.
- Glow is selective (`--glow-teal`): focus, the active item, the gate. No glowing paragraphs.
- Never rely on colour alone: pair hue with text, an icon or a shape.

## 4. Typography

| Family | Use | Weights | Notes |
|---|---|---|---|
| **Manrope** (variable) | English UI, headings, body, the wordmark | 400–800 (display 750, wordmark 800) | Tight negative tracking only on large headings (−0.02 to −0.025 em) |
| **Tajawal** | Arabic UI, headings, body (auto via `html[lang=ar]`) | 400, 500, 700, 800 | Letter-spacing 0; never uppercase-transform; headings line-height 1.25–1.35 |
| **JetBrains Mono** (variable) | Small telemetry labels only (`.eyebrow`, `.telemetry`, e.g. `SG//RADAR 02`) | 500 | 11 px, uppercase, tracking 0.08–0.18 em; in Arabic, eyebrows switch to Tajawal 700, 14 px |

**Scale** (`tokens.css`): 12 · 14 · 16 · 18 px, then fluid: xl 20–24 · 2xl 24–34 · 3xl 32–52 · 4xl 40–80 px.
Line-heights: tight 1.08 (display) · snug 1.25 (headings) · body 1.6. Measure: about 62 characters for lead text.

**Arabic rules:** natural Modern Standard Arabic, written for Arabic readers (not word-for-word translation);
right-to-left layout with logical CSS properties (`margin-inline-start`, `inset-inline-end`, `text-align: start`);
mirror directional icons (`.icon-flip`); keep the Latin wordmark and service acronyms in Latin script; give Arabic
lines a little more height than Latin (Tajawal sits deeper).

All fonts are self-hosted via Fontsource under the SIL Open Font License 1.1.

## 5. Iconography

- **lucide** line icons (ISC licence), 24 px grid, stroke **1.6** for service and content icons, `currentColor`.
- Line only — no filled, duotone, 3D or emoji icons. Rounded caps as lucide draws them; the logo is the only
  square-capped, angular drawing.
- Decorative icons are `aria-hidden`; meaning is always also given in text. Directional icons flip in RTL.

## 6. Visual style

Dark architectural environments · metallic gateway structures (gunmetal `#1C2638`) · controlled teal
illumination · sparse particles · subtle atmospheric depth (haze, fog low to the ground) · fine grid details on
floors and panels · crisp typography · selective glow. Dark glass panels (`--sg-glass`) float over the 3D world with
hairline borders (`--sg-line`). Mono telemetry details appear sparingly as wayfinding (`LAYER 03 / 05`).
Avoid: hooded hackers, padlocks, skulls, matrix rain, binary code, fire, glitch effects, stock photos of people at
keyboards.

## 7. Motion

- **Scroll-driven:** scrolling moves the camera, objects and text (Lenis → ScrollTrigger → one world timeline);
  motion explains where you are, it is not decoration.
- **Reversible:** scrolling back reverses every change consistently; nothing "plays once" on scroll.
- **Calm timing:** UI transitions 140 / 240 / 420 ms with ease-out `cubic-bezier(0.16, 1, 0.3, 1)`; glow pulses
  slow; no shakes, flashes or strobing.
- **Reduced motion:** with `prefers-reduced-motion` or the in-site toggle, the experience switches to static mode —
  no scroll-scrubbed or autoplaying motion, instant state changes, every section readable as cards and static art.
- **Performance:** motion never blocks reading or input; nothing runs per frame through React state.

## 8. Voice and tone

Calm authority. Plain words. Short sentences. Practical next steps.

| Do | Don't |
|---|---|
| "Understand your risks. Strengthen your defenses." | "Hackers are coming for you!" |
| "We help reduce the risk of account takeover." | "Never get hacked again." |
| "Start with a security assessment." | "Act now before it's too late!" |
| "Results depend on your configuration and the service scope." | "100 % secure, guaranteed." |

Words we use: *help, reduce, strengthen, understand, review, guide, clear, practical*.
Words we avoid: *guaranteed, unhackable, military-grade, 100 %, total protection, bulletproof*.

## 9. Honesty and copy rules

- No invented certifications, customer logos, testimonials, customer counts, statistics or guarantees.
- The threat radar is a **locally generated simulation** — always labelled "SIMULATED LIVE DEMO — NOT REAL THREAT
  INTELLIGENCE"; counters say "simulated events"; map points are illustrative, never attribution. We never claim to
  scan the visitor.
- Choosing services never "activates protection"; the Build scene is symbolic and says so.
- No backend: forms state "Demo request saved in this browser. No message has been sent." Nothing pretends that an
  email, booking, payment or scan happened.
- Authorised penetration testing requires ownership or explicit authorisation — stated wherever it can be chosen.
- The Monthly Security Review is not a staffed 24/7 monitoring service.
- Durations are labelled estimates; business pricing is quote-based; personal prices are labelled "Illustrative
  classwork price". Quiz and simulations are guidance, not a security diagnosis.
- Advertising follows the same rules (see `ad-package/`): no fictional incident, no guarantees, symbolic threats only.

## 10. Accessibility

- Text contrast ≥ 4.5 : 1 (all text colours above meet it on navy; most meet AAA 7 : 1).
- Visible focus: 2 px teal outline, 3 px offset, on every interactive element.
- Semantic structure: one `h1`, then `h2` per section, `h3` inside; decorative SVG and 3D are `aria-hidden`.
- Keyboard: every control operable; toggles use `aria-pressed`; radio-like groups are real radios or
  `role="radiogroup"`; live results use `aria-live="polite"`.
- Touch targets ≥ 44 px; layouts from 360 px to 1920 px without horizontal scrolling.
- Never colour alone; motion respects reduced-motion; Arabic is a first-class, fully mirrored layout.
