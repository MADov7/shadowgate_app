# 07 · Edit guide — CapCut, Premiere Pro, DaVinci Resolve

**Status:** VIDEO RENDER: PENDING — no video has been generated; this is the production-ready package for Google Flow.
This guide assumes you have the five Flow takes ([02](02-flow-prompts.md)). Until then you can rehearse the edit
with the animatic as a guide track (screen-record it, or use the still frames from `tools/preview-frames.mjs`).

## 1. Project settings

| Setting | Value |
|---|---|
| Master timeline | 1920×1080, **24.000 fps** (not 23.976), square pixels, progressive, Rec.709 SDR |
| Vertical timeline | 1080×1920, same frame rate (see [08](08-framing-9x16.md)) |
| Audio | 48 kHz, stereo |
| Start timecode | 00:00:00:00 (Premiere and Resolve often default to 01:00:00:00 — change it, or add 1 h to every timecode here) |
| Length | 288 frames: in 00:00:00:00, mark-out 00:00:12:00 |

## 2. Track layout

| Track | Content |
|---|---|
| V5 | (optional) full end card `endcard_{en,ar}.png` instead of separate ovL/ov5/ov6 |
| V4 | Overlay cards ov1–ov6, ovL (`assets/overlays/<fmt>/`) — **never graded** |
| V3 | Scrims (`scrim-*`) only where a shot is bright behind text |
| V2 | Adjustment layer: grade look, vignette, film grain |
| V1 | Footage: shots 1–5 |
| A1 | Sound design stems ([05](05-sound-design.md)) |
| A2 | Voice-over (optional, [04](04-voiceover.md)) |
| A3 | Licensed music bed (optional) |

Add markers: **f0** Hook · **f48** Product · **f120** Benefit · **f192** Brand · **f240** CTA, plus sync markers
**f44** threshold hit, **f158** interruption, **f198** brand resolve.

## 3. Picture assembly (V1)

| Shot | Record in | Record mark-out | Frames | Source (from the chosen 8 s take) | Speed |
|---|---|---|---|---|---|
| 1 Hook | 00:00:00:00 | 00:00:02:00 | 48 | 2 s window ending 3 frames after contact (contact lands on f44) | 100 % (≤ 200 % if slow) |
| 2 Product | 00:00:02:00 | 00:00:05:00 | 72 | 3 s from the start of the pass-through | 100 % (80–150 %) |
| 3 Benefit | 00:00:05:00 | 00:00:08:00 | 72 | 3 s with the interruption 38 frames in (f158) | 100 % (80–150 %) |
| 4 Brand | 00:00:08:00 | 00:00:10:00 | 48 | 2 s from the start of the edge-light trace | 100 % |
| 5 CTA | 00:00:10:00 | 00:00:12:00 | 48 | 2 s from the first movement of the doors | 100 % (≤ 150 %) |

Trim with the slip tool so sync points land on their markers; durations never change. The timeline must end at
exactly 00:00:12:00 — delete anything after f287 and set the export range in/out to 00:00:00:00–00:00:12:00.

## 4. Transitions

| Join | Frames | How |
|---|---|---|
| 1 → 2 | cut at f48 | Straight cut on motion (the push becomes the pass-through). Optional 2-frame directional blur across the cut. |
| 2 → 3 | cut at f120 | Invisible join: shot 3 was generated from shot 2's last frame. If there is a small jump, use a 4-frame cross-dissolve centred on the cut (f118–f121) or Morph Cut (Premiere) / Smooth Cut (Resolve). |
| 3 → 4 | f188–f202 | **Dip through dark:** shot 3 opacity 100 → 0 % over f188–f191; black at the cut f192; shot 4 0 → 100 % over f192–f202. |
| 4 → 5 | cut at f240 | Invisible join (shot 5 generated from shot 4's last frame); same fixes as 2 → 3. |
| End | f287 | No fade to black. The last frame holds the open gate and the end card (it doubles as the thumbnail). |

## 5. Overlays (V4)

Each card is a full-frame transparent image: place at position 0,0, scale 100 %, no fitting. In/out frames,
fades and the 6-frame rise are in [06](06-overlays.md); summary:

| Card | In | Mark-out | Entry | Exit |
|---|---|---|---|---|
| `ov1-hook_<lang>` | f0 | f48 | fade + rise 6 f | fade 6 f |
| `ov2-product_<lang>` | f54 | f120 | fade + rise 6 f | fade 6 f |
| `ov3-benefit-line1_<lang>` | f126 | f192 | fade + rise 6 f | fade 6 f |
| `ov3-benefit-line2_<lang>` | f138 | f192 | fade + rise 6 f | fade 6 f |
| `ov4-brand` | f198 | f246 | mark draw-on f198–f215, wordmark f204–f215 | dissolve to ovL f240–f245 |
| `ovL-endcard-lockup` | f240 | f288 | fade + rise 6 f | hold |
| `ov5-cta_<lang>` | f240 | f288 | fade + rise 6 f | hold |
| `ov6-slogan_<lang>` | f246 | f288 | fade + rise 6 f | hold |

Rise = animate position Y from +16 px (16:9) / +19 px (9:16) to 0 with ease-out, together with opacity 0 → 100 %.

**The real logo.** `ov4-brand`, `ovL-endcard-lockup` and the end cards are built from the real SVG paths
(`assets/shadow-gate-*.svg`, identical to `public/brand/`). Never trace, regenerate or restyle the logo.

| Editor | Import | Logo draw-on (ov4) |
|---|---|---|
| **CapCut** | Use the PNG cards (Media → Import). Keyframe opacity and position for fades/rises. | Fallback: 18-frame fade-in with scale 97 → 100 % from f198. |
| **Premiere Pro** | Use the PNG cards (Premiere does not import SVG). Keyframe Opacity/Position in Effect Controls. To retype, install Manrope and Tajawal and rebuild the text in Essential Graphics with the sizes in [06](06-overlays.md). | Animate in After Effects: import `assets/shadow-gate-mark.svg` (or the stacked lockup), convert to shapes, Trim Paths 0 → 100 % over f198–f215; or use the fade fallback. |
| **DaVinci Resolve** | PNG cards on the Edit page; recent Fusion versions can import the SVG as shapes. | In Fusion: animate the stroke's write-on 0 → 1 over f198–f215; or use the fade fallback. |

## 6. Grade (V2 adjustment layer)

Follow [03 §7](03-continuity.md#7-colour-grade):
1. **Balance** each shot (exposure, white balance toward cool neutral).
2. **Match** all shots to shot 4's still: same black level, same teal hue on the vectorscope, same haze density.
3. **Look:** black point at midnight navy `#070B14` (RGB 7, 11, 20) — lift, don't crush; highlights roll off to
   soft white `#F3F6FA`; global saturation down; teal `#35F2C4` protected; red `#FF4D5E` protected in shots 1–3 only.
4. **Vignette** 10–15 %, **film grain** fine and uniform (one grain layer over all shots).
5. Overlays sit **above** the adjustment layer so brand colours stay exact.

## 7. Audio

Import the sound stems and the VO, align to the markers (f44, f158, f198), mix to **−14 LUFS integrated, true peak
≤ −1.0 dBTP**. Remove any audio that came with the Flow clips.

## 8. Export

| Deliverable | Settings |
|---|---|
| 16:9 master | 1920×1080, 24 fps, H.264 High profile, level 4.2, progressive, 4:2:0 8-bit, Rec.709 tags, 2-pass VBR target 16 Mbps / max 24 Mbps (or CRF 16–18), AAC-LC 48 kHz stereo 320 kbps, "fast start" / web-optimised on |
| 9:16 vertical | 1080×1920, otherwise identical |
| File names | `shadow-gate_12s_16x9_en_v01.mp4`, `…_16x9_ar_…`, `…_9x16_en_…`, `…_9x16_ar_…` |
| Mezzanine (optional) | ProRes 422 HQ or DNxHR HQ, same frame size and rate, for re-encoding later |

### 25 fps delivery

Do not "conform" 24 → 25 (that speeds the spot up to 11.52 s). Build a separate 25 fps timeline of **300 frames**
and let the NLE convert the footage (frame blending or optical flow). Frame map:

| Item | 24 fps | 25 fps |
|---|---|---|
| Beats | 0 · 48 · 120 · 192 · 240 · 288 | 0 · 50 · 125 · 200 · 250 · 300 |
| ov1 | 0–48 | 0–50 |
| ov2 | 54–120 | 56–125 |
| ov3 (2nd sentence) | 126–192 (138) | 131–200 (144) |
| ov4 | 198–246 | 206–256 |
| ovL, ov5 | 240–288 | 250–300 |
| ov6 | 246–288 | 256–300 |
| Sync: hit · interruption · brand | 44 · 158 · 198 | 46 · 165 · 206 |
| Dip to black | out 188–191, in 192–202 | out 196–199, in 200–211 |

Fades stay 6 frames. The SRT files are in milliseconds and are valid for both frame rates.

## 9. Technical QC before release

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 shadow-gate_12s_16x9_en_v01.mp4      # → 12.000
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames,r_frame_rate,width,height -of csv=p=0 shadow-gate_12s_16x9_en_v01.mp4
#   → 1920,1080,24/1,288   (300 at 25 fps; 1080,1920 for vertical)
ffmpeg -hide_banner -i shadow-gate_12s_16x9_en_v01.mp4 -af loudnorm=print_format=summary -f null -   # → ≈ −14 LUFS, TP ≤ −1.0
```

Then run the checklist in [09](09-final-check.md).
