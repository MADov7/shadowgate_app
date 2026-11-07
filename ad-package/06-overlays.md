# 06 · Overlays — text, timing, type, placement

**Status:** VIDEO RENDER: PENDING — no video has been generated; this is the production-ready package for Google Flow.
The overlay graphics themselves are finished: `assets/overlays/16x9/` and `assets/overlays/9x16/` (transparent SVG
with embedded fonts + lossless PNG at native resolution). Machine-readable twin of this page:
[overlays.json](overlays.json). Reference subtitle tracks: [overlays.srt](overlays.srt) (EN),
[overlays.ar.srt](overlays.ar.srt) (AR).

**Time convention:** 24 fps; *In* = first frame visible (fade starts), *Out* = mark-out (first frame after the
element). Overlays enter 6 frames after a picture cut (f54, f126) so the cut reads first.

## Cue list

| ID | Beat | Exact text — EN | Exact text — AR | In | Out (mark-out) | On screen |
|---|---|---|---|---|---|---|
| ov1 | Hook | One weak point is enough. | نقطة ضعف واحدة تكفي. | f0 · 00:00:00:00 · 0.00 s | f48 · 00:00:02:00 · 2.00 s | 2.00 s |
| ov2 | Product | Cybersecurity for businesses and individuals. | أمن سيبراني للشركات والأفراد. | f54 · 00:00:02:06 · 2.25 s | f120 · 00:00:05:00 · 5.00 s | 2.75 s |
| ov3 | Benefit | Understand your risks. Strengthen your defenses. | افهم مخاطرك. عزّز دفاعاتك. | f126 · 00:00:05:06 · 5.25 s (2nd sentence f138 · 5.75 s) | f192 · 00:00:08:00 · 8.00 s | 2.75 s (2nd sentence 2.25 s) |
| ov4 | Brand | SHADOW GATE (stacked logo: mark + wordmark) | same (Latin logo) | f198 · 00:00:08:06 · 8.25 s | f246 · 00:00:10:06 · 10.25 s | 2.00 s, then becomes the end-card lockup |
| ovL | CTA | SHADOW GATE (horizontal lockup) | same (Latin logo) | f240 · 00:00:10:00 · 10.00 s | f288 · 00:00:12:00 · 12.00 s | 2.00 s, holds to the end |
| ov5 | CTA | Start with a security assessment. | ابدأ بتقييم أمني. | f240 · 00:00:10:00 · 10.00 s | f288 · 00:00:12:00 · 12.00 s | 2.00 s, holds to the end |
| ov6 | CTA | Your gateway to a safer digital world. | حمايتك تبدأ من هنا | f246 · 00:00:10:06 · 10.25 s | f288 · 00:00:12:00 · 12.00 s | 1.75 s, holds to the end |

Copy the strings exactly — including the full stops (the Arabic slogan has none, by design) and the shadda in
"عزّز". American spelling "defenses" is intentional.

Every message line is on screen for at least 2.0 s. The slogan (ov6) is a secondary line that enters 6 frames
after the CTA so the CTA reads first; if a platform requires ≥ 2 s for every line, start ov6 at f240 together with
the CTA (no other change needed).

## Line breaks per format

| ID | 16:9 EN | 16:9 AR | 9:16 EN | 9:16 AR |
|---|---|---|---|---|
| ov1 | One weak point is enough. | نقطة ضعف واحدة تكفي. | One weak point / is enough. | نقطة ضعف / واحدة تكفي. |
| ov2 | Cybersecurity for businesses / and individuals. | أمن سيبراني للشركات والأفراد. | Cybersecurity for / businesses and / individuals. | أمن سيبراني / للشركات والأفراد. |
| ov3 | Understand your risks. / Strengthen your defenses. | افهم مخاطرك. / عزّز دفاعاتك. | Understand your risks. / Strengthen your / defenses. | افهم مخاطرك. / عزّز دفاعاتك. |
| ov5 | Start with a security assessment. | ابدأ بتقييم أمني. | Start with a / security assessment. | ابدأ بتقييم أمني. |
| ov6 | Your gateway to a safer digital world. | حمايتك تبدأ من هنا | Your gateway to a safer digital world. | حمايتك تبدأ من هنا |

## Typography

| Element | EN | AR | Colour |
|---|---|---|---|
| Message lines (ov1–ov3, ov5) | Manrope **800**, line-height 1.12, tracking −0.01 em | Tajawal **800**, line-height 1.3, tracking 0 | Soft white `#F3F6FA` |
| Slogan (ov6) | Manrope **600** | Tajawal **500** | Muted slate `#A9B4C4` |
| Wordmark (ov4, ovL) | Manrope **800**, tracking 0.185 em, gap before GATE 0.37 em | same Latin wordmark | SHADOW `#F3F6FA`, GATE `#35F2C4` |
| Mark (ov4, ovL) | Real SVG paths from `src/brand/Logo.tsx`: frame `#F3F6FA`, S path `#35F2C4`, stroke 5/64 | same | — |
| Gate-cap accent | The mark's chamfered top (`M12 21L24.5 8.5h15L52 21`) as a small teal chevron above each line overlay | same | `#35F2C4` |

All type is centred. Arabic cards are set right-to-left. Fallback weight if 800 is unavailable: 700. Fonts:
Manrope and Tajawal (SIL Open Font License 1.1, via Fontsource) — embedded in every SVG card.

### Sizes (px at native resolution · share of frame height)

| Element | 16:9 (1920×1080) | 9:16 (1080×1920) |
|---|---|---|
| Message lines EN | 64 px · 5.93 % | 72 px · 3.75 % |
| Message lines AR | 70 px · 6.48 % | 80 px · 4.17 % |
| Slogan EN | 34 px · 3.15 % | 42 px · 2.19 % |
| Slogan AR | 38 px · 3.52 % | 46 px · 2.40 % |
| Brand card mark (ov4) | 210 px · 19.44 % | 260 px · 13.54 % |
| Brand card wordmark (ov4) | 72 px · 6.67 % | 84 px · 4.38 % |
| End-card lockup mark height (ovL) | 108 px · 10.00 % | 132 px · 6.88 % |

## Placement and safe areas

| Format | Title-safe box (all text inside) | Other zones |
|---|---|---|
| 16:9 | 90 %: x 96–1824, y 54–1026 | Action-safe 93 %: x 67–1853, y 38–1042 |
| 9:16 | x 120–960, y 260–1400 | Keep clear: platform top bar y 0–260; caption / sound / CTA button area y 1400–1920; action rail x 960–1080, y 900–1400 |

| Element | 16:9 | 9:16 |
|---|---|---|
| Message lines (ov1–ov3) | Lower third, centred; **last** baseline at y 936 (86.67 %); gate-cap accent above the first line | Upper third, centred; **first** baseline at y 420 (21.88 %); gate-cap accent above |
| Brand card (ov4) | Stacked, centred; mark top y 150, wordmark baseline y 470 — above the gate | Stacked, centred; mark top y 350, wordmark baseline y 755 |
| End card (ovL + ov5 + ov6) | Lockup centred at y 190; CTA first baseline y 380; slogan 72 px below the last CTA baseline | Lockup centred at y 350; CTA first baseline y 560; slogan 96 px below (× 1.2 for Arabic) |

`node ad-package/tools/build.mjs` checks all 111 text elements against these boxes; the current build reports
0 outside the title-safe area and 0 inside a platform UI zone.

## Animation

| Element | Entry | Exit |
|---|---|---|
| ov1, ov2, ov3 | Fade 0 → 100 % + rise of 1.5 % of frame height (16 px, 16:9) / 1 % (19 px, 9:16) over 6 frames, ease-out (cubic) | Fade 100 → 0 % over the last 6 frames (ov1 f42–f47, ov2 f114–f119, ov3 f186–f191) |
| ov3 second sentence | Same entry, starting f138 | Exits with the first sentence |
| ov4 brand | Mark strokes draw on f198–f215 (ease-out); wordmark fades + rises f204–f215 | Cross-dissolves into the end-card lockup f240–f245 |
| ovL, ov5 | Fade + rise over 6 frames from f240 | None — holds to the final frame |
| ov6 | Fade + rise over 6 frames from f246 | None — holds to the final frame |

Legibility: if a shot is bright behind the text, add the matching text-free scrim (`scrim-lower` under the 16:9
line overlays, `scrim-upper` under the 16:9 brand/end card and under every 9:16 overlay, `scrim-vignette` for
extra edge darkening) under the overlay track; the scrims already carry their navy gradient (max 55–70 %), so
use them at 50–100 % layer opacity. Never add drop
shadows heavier than the cards already carry.

## Files

| Cue | 16:9 | 9:16 |
|---|---|---|
| ov1 | `assets/overlays/16x9/ov1-hook_en.svg` / `_ar.svg` (+ `.png`) | `assets/overlays/9x16/ov1-hook_en.svg` / `_ar.svg` (+ `.png`) |
| ov2 | `…/16x9/ov2-product_{en,ar}` | `…/9x16/ov2-product_{en,ar}` |
| ov3 | `…/16x9/ov3-benefit_{en,ar}` or split `ov3-benefit-line1_*` + `ov3-benefit-line2_*` | same in `9x16/` |
| ov4 | `…/16x9/ov4-brand` | `…/9x16/ov4-brand` |
| ovL | `…/16x9/ovL-endcard-lockup` | `…/9x16/ovL-endcard-lockup` |
| ov5 | `…/16x9/ov5-cta_{en,ar}` | `…/9x16/ov5-cta_{en,ar}` |
| ov6 | `…/16x9/ov6-slogan_{en,ar}` | `…/9x16/ov6-slogan_{en,ar}` |
| End card (all three in one) | `…/16x9/endcard_{en,ar}` (transparent) · `endcard_{en,ar}_solid` (navy background) | same in `9x16/` |
| Scrims (no text) | `scrim-lower` (line overlays), `scrim-upper` (brand / end card), `scrim-vignette` | `scrim-upper` (all overlays sit in the upper half), `scrim-vignette` |

Each card is a full-frame transparent image: drop it on the timeline at 0,0 with no scaling.

## SRT and JSON

- The SRT files list what text is on screen and when (cue 4 spans the brand card and the end-card lockup). They are
  a reference and an optional caption track — the overlays are already burned into the picture, so do not upload
  them as captions *and* burn them in unless the platform hides captions by default.
- `overlays.json` carries the same data plus styles, placement and asset paths for automated renderers.
