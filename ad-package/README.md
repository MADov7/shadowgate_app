# SHADOW GATE — 12-second advertisement package (Google Flow)

> **Rendered videos (12.0 s, 24 fps, with original synthesised soundtrack) — in `render/`:**
>
> | File | What it is |
> |---|---|
> | `shadow-gate-ad-12s-en-16x9.mp4` · `-ar-16x9` · `-en-9x16` · `-ar-9x16` | **Main ad.** Rendered from the storefront's own 3D world (gate, network, protection layers, symbolic gate, horizon) with the real SVG logo and brand typography composited on top. |
> | `shadow-gate-ad-animatic-en-16x9.mp4` · `-ar-16x9` · `-en-9x16` · `-ar-9x16` | The HTML animatic exported to video (simple shapes; timing previz). |
>
> These were produced by Claude with code (WebGL capture + ffmpeg), not by a video-generation model. The **Google Flow
> version is still pending** — no Flow footage has been generated (no Flow account was available). Everything needed to
> generate it is in this package: storyboard, prompts, continuity bible, voice-over, sound design, overlay graphics with
> exact timings, edit guide, vertical reframing guide and a final checklist.

**How the rendered video was made:** `ad.html` + `src/ad/*` drive the site's 3D scene frame by frame from the same
timeline as this storyboard (`src/ad/timeline.ts`, overlay timings from `overlays.json`); `scripts/ad/capture.mjs`
captures plates and transparent typography layers, `scripts/ad/synth-audio.mjs` synthesises the soundtrack (no samples),
and `scripts/ad/assemble.mjs` composites and encodes the MP4s. Re-render: start `npm run dev` on port 5190, then run the
captures and `node scripts/ad/assemble.mjs`.

| | |
|---|---|
| Brand | SHADOW GATE — *Your gateway to a safer digital world.* · حمايتك تبدأ من هنا |
| Length | **12.0 s exactly** — 288 frames at 24 fps (25 fps alternative in [07](07-edit-guide.md#25-fps-delivery)) |
| Structure | Hook (0–2 s) → Product (2–5 s) → Benefit (5–8 s) → Brand (8–10 s) → CTA (10–12 s) |
| Formats | 16:9 master 1920×1080 · 9:16 vertical 1080×1920 |
| Versions | English overlays (Manrope) · Arabic overlays (Tajawal) — same footage |
| Message | Calm, honest, practical: no guarantees, no fear-mongering, no fictional incident |

## Index

| File | What it is |
|---|---|
| [01-storyboard.md](01-storyboard.md) | Timed storyboard: five shots, frame-accurate in/out, camera, action, lighting, sound, overlay, transition |
| [02-flow-prompts.md](02-flow-prompts.md) | Google Flow (Veo) prompts per shot, shared style preamble, negative prompt, ingredients and continuity method |
| [03-continuity.md](03-continuity.md) | Visual bible: gateway geometry from the real logo, materials, palette, light, fog, lens language, grade |
| [04-voiceover.md](04-voiceover.md) | Optional VO script, 27 words EN, timed to beats + Arabic alternative + delivery notes |
| [05-sound-design.md](05-sound-design.md) | Sound layers, frame-accurate cue map, mix and loudness target (−14 LUFS), sourcing advice |
| [06-overlays.md](06-overlays.md) | Every overlay: exact text EN/AR, in/out, font, size, safe-area placement, animation, asset files |
| [overlays.srt](overlays.srt) · [overlays.ar.srt](overlays.ar.srt) | On-screen text as SubRip (reference / caption track) |
| [overlays.json](overlays.json) | Machine-readable timing, styles, placement and asset paths (single source for any renderer) |
| [07-edit-guide.md](07-edit-guide.md) | Assembly in CapCut, Premiere Pro or DaVinci Resolve; trims to 12.0 s; grade; export settings |
| [08-framing-9x16.md](08-framing-9x16.md) | 16:9 master framing and how each shot reframes to 9:16 |
| [09-final-check.md](09-final-check.md) | Release checklist (duration, beats, legibility, honesty, colours, real logo) |
| [assets/](assets/) | Real brand SVGs, PNG renders, transparent overlay title cards and end cards (16:9 + 9:16, EN + AR) |
| [animatic/index.html](animatic/index.html) | Self-contained 12 s animatic with play/replay, frame scrubber, timecode, 16:9/9:16, EN/AR |
| [tools/](tools/) | `cues.mjs` (single source of truth), `build.mjs` (regenerates assets/JSON/SRT/animatic), `preview-frames.mjs` |

## How to use the package

1. **Watch the animatic.** Open `animatic/index.html` directly in a browser (no server, no network requests).
   Press **Play** (or <kbd>Space</kbd>). Toggle 16:9 / 9:16, EN / AR, safe areas, and the optional temp sound
   sketch. This is the timing every later step must match.
2. **Read the continuity bible** ([03](03-continuity.md)) so every shot shares one world: the same gateway, the
   same palette, the same light.
3. **Generate the five shots in Google Flow** with [02](02-flow-prompts.md). Build the reference stills
   ("ingredients") first, then generate shot by shot, using the last frame of each shot as the first frame of the
   next where the prompt says so. Footage must be **clean** — no text, letters, logos or UI.
4. **Assemble** in your editor with [07](07-edit-guide.md): trim to the exact frames in [01](01-storyboard.md),
   add the overlay cards from `assets/overlays/`, the sound design ([05](05-sound-design.md)) and, optionally, the
   voice-over ([04](04-voiceover.md)).
5. **Reframe for 9:16** with [08](08-framing-9x16.md) and the `assets/overlays/9x16/` cards.
6. **Run the checklist** in [09](09-final-check.md) before exporting.

## Assets at a glance

- `assets/shadow-gate-mark.svg`, `-mark-mono.svg`, `-lockup.svg` — byte-identical copies of `public/brand/*.svg`
  (the real mark: chamfered gateway frame + angular S path, from `src/brand/Logo.tsx`).
- `assets/shadow-gate-lockup-stacked.svg` — mark above wordmark, for the Brand beat.
- `assets/png/` — transparent PNG renders of the logo files (for editors that cannot import SVG).
- `assets/overlays/16x9/` and `assets/overlays/9x16/` — one transparent full-frame card per overlay line
  (`ov1-hook_en.svg/.png` …), the benefit line split per sentence, the brand card, the end-card lockup, full end
  cards (transparent and solid navy), and text-free legibility scrims. SVG cards embed their fonts (Manrope /
  Tajawal, SIL OFL 1.1); PNGs are lossless renders at native resolution.

## Regenerating

All timings, strings and placements live in `tools/cues.mjs`. After changing it, run
`node ad-package/tools/build.mjs` from the project root: it rewrites the overlay cards, `overlays.json`, the SRT
files and the animatic, and fails if any text leaves the title-safe area or enters a 9:16 platform UI zone.
`node ad-package/tools/preview-frames.mjs shots/adpack --times 1,6,11` saves still frames of the animatic.

## Honesty notes

- The red pulse is a **symbolic, simulated** threat. The ad does not depict or describe a real incident, customer
  or attack, and shows no statistics, certifications or customer logos.
- No claim promises protection: the copy says *understand*, *strengthen*, *start with an assessment*.
- The Brand and CTA beats use the real SVG logo added in editing — never an AI-generated imitation of it.
