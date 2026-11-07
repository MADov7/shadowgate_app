# 05 · Sound design

**Status:** VIDEO RENDER: PENDING — no video has been generated; this is the production-ready package for Google Flow.
No final mix exists. The animatic's **Temp sound sketch** toggle plays a synthesised timing guide of this exact map
(Web Audio, generated in the page) — use it to feel the rhythm, not as the final mix.

Character: restrained, architectural, precise. Tension in the first two seconds, then resolution. No sirens, no
explosions, no glitch "hacker" effects, no stock "data" beeps.

## Layers

| # | Layer | Description | Notes |
|---|---|---|---|
| 1 | **Low drone bed** | Sine ≈ 55 Hz (A1) + soft triangle a fifth up (≈ 82 Hz), low-passed ≈ 300 Hz; slow movement | The glue of the whole spot; ducks into the dip, tapers to silence at the end |
| 2 | **Threat pulse whoosh** | Band-passed noise rising ≈ 380 Hz → 2.6 kHz as the pulse accelerates | Follows the pulse's speed; pans gently left → centre in stereo |
| 3 | **Threshold hit** | Restrained two-tone hit (≈ G3 + G♯3, short, low-passed) | A tense "notice" — not an alarm or siren |
| 4 | **Pass-through** | Low-passed air rush (3.2 kHz → 380 Hz) | Camera passes through the gate |
| 5 | **Node pings** | Three soft sine pings (A5, C♯6, E6), short decays | Website, email, account |
| 6 | **Layer lock-ins** | Tiny high click + tone (A4, C♯5, E5) for each ring | The "secure fit" sound — mechanical, quiet |
| 7 | **Interruption** | Soft absorbed sub thud (90 → 42 Hz sweep) + muffled noise tail | The threat stops — no explosion, no impact crack |
| 8 | **Reverse swell** | Short band-passed reverse air into the dip to black | Sets up the brand |
| 9 | **Brand resolve hit** | Deep sub (55 Hz) + soft fifth/octave body + a faint high shimmer | Lands with the logo draw-on |
| 10 | **Calm open swell** | A-major add9 pad (A3, C♯4, E4, B4) + airy high noise | The gate opens to the teal horizon |

The pitch set stays in A (A, C♯, E, B) so every element agrees with the drone.

## Cue map (24 fps)

| Frame(s) | Time (s) | Event | Layer | Level guide |
|---|---|---|---|---|
| f0–f14 | 0.00–0.60 | Drone fades in | 1 | Bed at ≈ −24 LUFS short-term |
| f4–f44 | 0.15–1.83 | Whoosh rises with the pulse | 2 | Builds to ≈ −16 dBFS peak |
| **f44** | 1.83 | Pulse reaches the threshold — restrained hit | 3 | ≈ −14 dBFS peak, 0.45 s decay |
| f47–f61 | 1.95–2.55 | Pass through the gate | 4 | Under the cut at f48 |
| f59 · f68 · f78 | 2.45 · 2.85 · 3.25 | Node pings: website, email, account | 5 | Quiet, −20 dBFS |
| f133 · f142 · f150 | 5.55 · 5.90 · 6.25 | Layer lock-ins | 6 | Click −18 dBFS, tone −20 dBFS |
| **f158** | 6.60 | Threat path interrupted — absorbed thud | 7 | ≈ −12 dBFS sub, short |
| f181–f192 | 7.55–8.00 | Reverse swell into the dip | 8 | Cuts dead at f192 |
| f192–f199 | 8.00–8.30 | Drone ducks then returns | 1 | ≈ −10 dB dip |
| **f198** | 8.25 | Brand resolve hit (with the mark draw-on) | 9 | Loudest moment: peaks ≈ −6 dBFS before the master limiter |
| f240–f287 | 10.00–12.00 | Calm open swell as the doors part | 10 | Rises to f269, eases to the end |
| f282–f287 | 11.75–12.00 | Everything tapers to silence | all | Last frame is silent (no click) |

VO (optional, [04](04-voiceover.md)) sits on top: duck layers 1 and 10 by 3–4 dB under each line with a 50 ms
attack / 250 ms release; keep pings and lock-ins out of the VO's consonants by nudging them ±2 frames if needed.

## Mix and loudness

- **Delivery target:** −14 LUFS integrated (web / social), true peak ≤ −1.0 dBTP, loudness range ≈ 5–8 LU.
- Stereo, 48 kHz / 24-bit masters; AAC 48 kHz in the exported MP4.
- Keep the low end controlled: high-pass everything except the drone, the interruption thud and the brand hit at
  ≈ 40 Hz; the sub content must still translate on phone speakers (add a little 110–220 Hz body to the hits).
- Check the 9:16 export on a phone speaker and earbuds; the threshold hit and lock-ins must still read.
- The ad must also work **muted**: all meaning is carried by picture and overlays.

## Sourcing

- **Preferred:** original sound design — every layer above is simple synthesis plus filtered noise (any DAW's
  stock synth works); the animatic's temp sketch shows the recipe. Original material has no licensing risk.
- **Royalty-free libraries:** only with a licence that covers paid advertising on all target platforms. Save the
  licence or receipt and the asset IDs with the project.
- **Do not** use commercial music, unlicensed "free" downloads, sounds ripped from films/games, or Veo's
  generated audio (discard it — it is not controllable or timed to this map).
- If a music bed is added, it must be licensed for advertising and sit under the sound design, not replace it.
