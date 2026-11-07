# 08 · Framing — 16:9 master and 9:16 vertical

**Status:** VIDEO RENDER: PENDING — no video has been generated; this is the production-ready package for Google Flow.
Preview both frames in the animatic (Frame: 16:9 / 9:16, tick *Safe areas*).

## Composition rule

Everything that matters sits on the **vertical centre line**: the gateway, the network hub, the doors' seam. The
16:9 master is composed centre-weighted so the vertical version can be cut from it, and every shot keeps a calm,
empty zone where its overlay goes.

## Framing targets

| Shot | 16:9 master (1920×1080) | 9:16 vertical (1080×1920) | Overlay zone |
|---|---|---|---|
| 1 Hook | Gateway centred; base at 73 % of frame height, top at 28 %; lower 20 % calm for the line overlay | Gateway centred horizontally; top ≈ 38 %, base ≈ 68 % | 16:9 lower third · 9:16 upper third |
| 2 Product | Network centred at 42 % of frame height; nothing important below 70 % | Network centred at 52 %; upper third clear | 16:9 lower third · 9:16 upper third |
| 3 Benefit | Same as shot 2; the pull-back keeps all three rings inside the action-safe area | Same as shot 2; rings may touch the side edges but not leave them | 16:9 lower third · 9:16 upper third |
| 4 Brand | Gateway in the lower half: top ≈ 50 %, base ≈ 89 %; upper 45 % dark and empty | Gateway lower: top ≈ 44 %, base ≈ 73 %; upper 42 % dark and empty | Logo above the gate in both |
| 5 CTA | Same as shot 4; dolly-in ≈ 10 % keeps the upper 45 % clear | Same as shot 4; dolly-in ≈ 8 % keeps the upper 42 % clear | End card above the gate in both |

In 9:16, the bottom 520 px (y 1400–1920) are covered by platform captions and buttons, and a 120 px rail on the
right (y 900–1400) by like/comment/share. Nothing important — and no text — goes there.

## Route A (preferred): generate 9:16 natively

If your Flow plan offers 9:16, generate a second set of the five shots in portrait using the same preamble,
ingredients and continuity chain, adding to each prompt:

| Shot | Add to the prompt |
|---|---|
| 1 | "Vertical 9:16 framing. The gateway is centred and fills the middle of the frame; the red point of light enters from the lower left and travels up the floor toward the threshold. Dark empty space above the gateway." |
| 2 | "Vertical 9:16 framing. The three nodes form a tight triangle above the hub (one high in the centre, two lower left and right) so all three fit the narrow frame. Dark empty space in the upper third." |
| 3 | "Vertical 9:16 framing. The rings are taller than wide, wrapping the network closely. Dark empty space in the upper third." |
| 4–5 | "Vertical 9:16 framing. The gateway stands in the lower-middle of the frame; the upper 40 % of the frame is dark, empty negative space." |

Make new 9:16 ingredient stills first (A, B, C) so the vertical set is as consistent as the master.

## Route B: reframe the 16:9 master

A full-height 9:16 crop of a 1080p frame is only 608 px wide (a 178 % upscale), and it would cut the network's
side nodes. Instead, scale each shot only as much as its subject needs, centre it horizontally, and fill the rest
of the tall frame with feathered midnight navy (`#070B14`, 120–200 px feather) — the zones above and below are meant
to be dark anyway. Starting values (from the animatic's geometry — adjust to the real footage until the targets
above are met):

| Shot | Scale of the 16:9 image | 16:9 image top edge in the 9:16 frame | Filled with navy | Notes |
|---|---|---|---|---|
| 1 Hook | ≈ 118 % (2276×1280) | y ≈ 372 | top 0–372, bottom 1652–1920 | The pulse enters from the left frame edge around f12–f20; optionally keyframe a slow horizontal reposition (≤ 150 px) to follow it |
| 2 Product | ≈ 105 % (2016×1134) | y ≈ 521 | top 0–521, bottom 1655–1920 | All three nodes stay inside the 1080 px width |
| 3 Benefit | ≈ 105 % | y ≈ 521 | same as shot 2 | The outer ring (≈ 1000 px wide at this scale) just fits the width |
| 4 Brand | ≈ 132 % (2534×1426) | y ≈ 133 | top 0–133, bottom 1559–1920 | Gate base lands at ≈ 73 % (y 1402) |
| 5 CTA | ≈ 132 % | y ≈ 133 | same as shot 4 | Keep the 16:9 dolly; no extra scale animation |

Use the editor's best scaler (Resolve Super Scale, or an equivalent upscaler) when scaling above 110 %. Apply the
same grain to the whole vertical frame, including the navy fills, so they blend.

## Overlay repositioning

Do not scale or move the 16:9 cards — use the purpose-built `assets/overlays/9x16/` cards, which already apply the
vertical placement and line breaks:

| Overlay | 16:9 | 9:16 |
|---|---|---|
| Line overlays (ov1–ov3) | Lower third, last baseline y 936 (86.7 %) | Upper third, first baseline y 420 (21.9 %), extra line breaks |
| Brand card (ov4) | Mark top y 150, wordmark baseline y 470 | Mark top y 350, wordmark baseline y 755 |
| End card (ovL, ov5, ov6) | Lockup y 190, CTA baseline y 380 | Lockup y 350, CTA baseline y 560 |

Under the 9:16 line overlays, the navy fill (route B) or the dark upper third (route A) gives the contrast; add
`scrim-upper` if a shot is bright there.

## Check in both formats

- Gateway and hub on the centre line; nothing important in the 9:16 platform zones.
- Overlays inside the title-safe box (16:9: 90 %; 9:16: x 120–960, y 260–1400).
- No black bars, no visible seams where navy fills meet the picture.
- The red pulse, nodes and rings remain readable on a phone at arm's length.
