# 09 · Final check

**Status:** VIDEO RENDER: PENDING — no video has been generated; this is the production-ready package for Google Flow.
Part A was checked on this package. Part B must be ticked on each exported video file before release — it cannot
be ticked yet because no video exists.

## Part A — package (checked)

| ✓ | Check | How it was verified |
|---|---|---|
| ✓ | Duration within 10–15 s: **12.0 s** | 48 + 72 + 72 + 48 + 48 = 288 frames at 24 fps (`tools/cues.mjs`, `overlays.json` `totalFrames: 288`) |
| ✓ | Five beats in order: Hook → Product → Benefit → Brand → CTA | Storyboard, overlays.json `beats[]`, animatic beat labels at t = 1, 3.5, 6, 9, 11 s |
| ✓ | Beat times: 0–2 · 2–5 · 5–8 · 8–10 · 10–12 s | 01-storyboard overview table and overlays.json |
| ✓ | Overlay strings exact (EN): "One weak point is enough." · "Cybersecurity for businesses and individuals." · "Understand your risks. Strengthen your defenses." · "SHADOW GATE" · "Start with a security assessment." | `overlays.json`, `overlays.srt`, overlay cards and animatic generated from one source (`tools/cues.mjs`) |
| ✓ | Every message overlay on screen ≥ 2.0 s (hook 2.0, product 2.75, benefit 2.75, brand 2.0, CTA 2.0) | 06-overlays cue list; slogan 1.75 s as a secondary line (option to extend documented) |
| ✓ | All overlay text inside title-safe; nothing in 9:16 platform UI zones | `node ad-package/tools/build.mjs`: 111 elements, 0 violations |
| ✓ | Logo = real SVG paths (`MARK_FRAME`, `MARK_S` from `src/brand/Logo.tsx`) | `assets/shadow-gate-*.svg` are byte-identical copies of `public/brand/*.svg`; cards are built from the same paths |
| ✓ | Brand colours only: `#070B14`, `#35F2C4`, `#F3F6FA` (+ muted `#A9B4C4`); red `#FF4D5E` only for the threat pulse | 03-continuity palette; colour scan of every overlay SVG: text/marks use only `#F3F6FA`, `#35F2C4`, `#A9B4C4`; navy `#070B14` and soft teal `#8AF7DA` appear only in the solid end-card backgrounds and the text shadow |
| ✓ | No guarantee claims ("100 %", "guaranteed", "fully secure", "military-grade") anywhere in overlays or VO | Copy review of 04, 06, overlays.json |
| ✓ | Not a fictional incident report: no named victim, company, date, statistic or "breach" story; the threat is a symbolic, simulated pulse | Storyboard and prompts; animatic notes |
| ✓ | Footage specified as clean (no text, logos, UI, people) | 02-flow-prompts preamble + negative prompt + review list |
| ✓ | Animatic clearly labelled "Animatic · timing previz — not the final AI video" and works offline | Playwright screenshots via `file://` with zero external requests, zero page/console errors |
| ✓ | Status line present: "VIDEO RENDER: PENDING — no video has been generated; this is the production-ready package for Google Flow." | README, every numbered document, overlays.json, animatic |

## Part B — each exported video (tick per file)

File: ____________________ (16:9 EN / 16:9 AR / 9:16 EN / 9:16 AR)

**Timing**
- [ ] Duration is exactly 12.000 s (ffprobe), 288 frames at 24 fps (300 at 25 fps).
- [ ] Beat cuts at f48, f120, f192 (dip), f240 — compare against the animatic side by side.
- [ ] Threshold hit on f44, interruption on f158, brand resolve on f198 — picture and sound together.
- [ ] Ends on the open gate + end card; no black frames at the head or tail.

**Overlays**
- [ ] Strings match 06-overlays character for character (punctuation, "defenses", Arabic shadda in "عزّز").
- [ ] Each line readable at phone size; on screen for the full duration in 06 (≥ 2.0 s for message lines).
- [ ] Arabic version uses Tajawal cards, right-to-left, logo stays Latin.
- [ ] Logo is the real SVG mark (frame + S path, white and teal), never an AI-generated or redrawn version.
- [ ] Nothing inside the 9:16 platform UI zones.

**Picture**
- [ ] No text, letters, numbers, logos, UI or faces generated into the footage (check every frame of every shot).
- [ ] No fire, explosions, sparks, skulls, hooded figures or other hacker clichés.
- [ ] Red appears only on the threat pulse and disappears at the interruption.
- [ ] Gateway silhouette consistent in all shots (chamfered top, flat top, open bottom).
- [ ] Grade matches 03: navy black point, protected teal, soft whites, uniform grain.

**Sound**
- [ ] −14 LUFS integrated (±1), true peak ≤ −1.0 dBTP; no Veo-generated audio left in.
- [ ] All sound sources original or licensed for advertising; licences filed.
- [ ] Works muted (meaning carried by picture + overlays).

**Honesty and brand**
- [ ] No guarantee or absolute claims in picture, overlays, VO, captions or the post text.
- [ ] No invented statistics, customers, certifications or incident details.
- [ ] Slogan correct: "Your gateway to a safer digital world." / "حمايتك تبدأ من هنا".
- [ ] If the ad is published with a caption or description, it does not call the footage "real" threat activity.

**Delivery**
- [ ] H.264 High, yuv420p, 1920×1080 or 1080×1920, AAC 48 kHz; fast start on.
- [ ] File named per 07-edit-guide (`shadow-gate_12s_<aspect>_<lang>_vNN.mp4`).
- [ ] README status line updated only once a real video file exists, naming its file path.
