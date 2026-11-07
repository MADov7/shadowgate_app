# 03 · Continuity bible

**Status:** VIDEO RENDER: PENDING — no video has been generated; this is the production-ready package for Google Flow.
One world, one gateway, one light. Everything below must hold in all five shots and in both formats.

## 1. The gateway — geometry from the real logo

The gateway is the 3D, architectural version of the frame stroke of the real mark (`src/brand/Logo.tsx`,
`MARK_FRAME = M12 58V21L24.5 8.5h15L52 21v37` on a 64-unit grid, stroke 5):

```
        ┌──────┐            flat top: 15 units  (37.5 % of the outer width)
      ╱          ╲          chamfers: 12.5 × 12.5 units — exactly 45°
    ╱              ╲
   │                │       straight legs: 37 units (≈ 75 % of the height)
   │                │
   │                │       outer width 40 units : height 49.5 units  →  ≈ 0.81 : 1
   │                │       frame thickness = stroke 5 units = 12.5 % of the width
   ┴                ┴       open at the bottom: no sill — the floor runs through the threshold
```

- **Silhouette:** tall, symmetrical, two 45° chamfered top corners, a flat top, vertical legs, open bottom. Never
  round, never arched, never a plain rectangle, never a hexagon with angled legs.
- **Depth:** the frame is a deep architectural portal (depth ≈ 1.5 × frame thickness), with a slight inner step
  where the teal light line sits.
- **Scale:** monumental — about 3–4 storeys relative to the floor grid. No human figure is ever shown for scale.
- **The S path** (`MARK_S`) belongs to the logo only. Footage never shows an S, a letter or the logo; the logo is
  overlaid in editing.
- **Doors (shots 4–5 only):** two flat panels of the same gunmetal fill the opening, meeting at a thin vertical
  seam on the centre line. They slide sideways into the legs; they never swing.
- **Protection rings (shot 3):** elongated octagons that reuse the same 45° chamfer language, translucent teal,
  thin edges. Three of them, concentric, evenly spaced.

## 2. Materials

| Element | Material | Notes |
|---|---|---|
| Gateway frame, doors | Dark gunmetal `#1C2638`, satin (not mirror), fine brushed grain | Reads as solid metal, never plastic |
| Edge light | Thin electric-teal emissive line `#35F2C4` inset along the inner edge | ≈ 1/10 of the frame thickness; glow kept tight |
| Floor | Polished dark stone `#0A1020` with a fine grid of faint teal lines (≈ 6–10 % opacity) | Grid fades out with distance |
| Network nodes | Soft-white glass-like emissive glyphs `#F3F6FA` → teal when protected | Abstract shapes, no markings |
| Hub | Small teal emissive core on a low circular dark platform | |
| Rings | Translucent teal `#35F2C4`, edges brightening to `#8AF7DA` on lock-in | |
| Threat pulse | Small red emissive point `#FF4D5E` with a short fading trail | Ash-grey `#6B7688` after the interruption |

## 3. Palette

| Colour | Hex | Role in the ad |
|---|---|---|
| Midnight navy | `#070B14` | Darkest value, background, black point of the grade |
| Navy surfaces | `#0A1020` · `#0E1628` · `#142035` | Floor, hall walls, haze in shadow |
| Gunmetal | `#1C2638` | Gateway and doors |
| Electric teal | `#35F2C4` | Protection, brand light, focus — the only saturated colour |
| Soft teal | `#8AF7DA` | Highlights on teal edges, horizon glow |
| Soft white | `#F3F6FA` | Nodes, rim light, specular highlights (never pure #FFFFFF) |
| Muted slate | `#A9B4C4` | Slogan text in the end card |
| Threat red | `#FF4D5E` | **Only** the simulated threat pulse, shots 1–3, extinguished at f158 |
| Ash | `#6B7688` | The interrupted threat's residue (shot 3) |

No other hues: no purple, orange, pink, green-yellow or blue neon.

## 4. Light

| Shot | Key | Fill / ambient | Accent | Mood |
|---|---|---|---|---|
| 1 Hook | Weak teal edge light (one dim, flickering segment) | Very low navy | Red pulse — the only warm light | Tension, restrained |
| 2 Product | Soft-white node glow | Slightly lifted navy | Teal hub, tiny red far away | Clarity |
| 3 Benefit | Teal rings become the key | Teal bounce on the platform | Red goes out at the interruption | Reassurance |
| 4 Brand | Rim light from behind the gate | Almost none | Teal outline + seam | Monumental, quiet |
| 5 CTA | Teal horizon backlight through the opening | Teal floor path toward camera | — | Calm, open |

Glow is selective: only edges, nodes, the hub and the horizon glow. No full-frame bloom, no lens-flare streaks.

## 5. Atmosphere

- **Haze:** light volumetric haze, densest near the floor (bottom third), never hides the gateway silhouette.
- **Fog (shots 4–5):** low ground fog at the gate's base, catching teal light.
- **Particles:** sparse dust motes (dozens, not thousands), drifting slowly upward, catching teal light. Same density
  in every shot.
- **Grid:** fine and faint, always on the floor plane, never floating in the air.

## 6. Lens and camera language

- **35 mm** for the story shots 1–3 (immersive, readable space); **50 mm** for the brand shots 4–5 (monumental,
  compressed, symmetrical).
- Eye-level or slightly low camera; horizon level; no Dutch angles; no handheld shake; no whip pans; no snap zooms.
- Movement is slow and motivated: push-in (1), dolly through + orbit right (2), orbit right + pull-back (3), static
  with a tiny push (4), symmetrical dolly forward (5). Direction continues across every continuous join.
- Shallow but not extreme depth of field: the subject sharp, the far hall softly out of focus.
- Natural 24 fps motion blur (180° shutter look).

## 7. Colour grade

- Black point sits at midnight navy (`#070B14`), not pure black; shadows keep a cool blue cast.
- Highlights roll off softly to soft white; nothing clips to pure white except tiny speculars.
- Overall saturation low; teal protected and slightly boosted; red protected in shots 1–3 only.
- Gentle vignette (≈ 10–15 %), fine film grain (consistent across shots, applied after the cut, not per clip).
- No teal-orange LUT, no crushed blacks, no heavy contrast curves.

## 8. Must stay identical across shots

1. Gateway silhouette and proportions (0.81 : 1, 45° chamfers, flat top, open bottom).
2. Gunmetal colour and satin finish; teal edge-light thickness.
3. Floor grid spacing and opacity; haze density; particle density and direction (slowly upward).
4. Palette and grade (section 3 and 7); red only on the threat pulse.
5. Camera language per chain (35 mm for 1–3, 50 mm for 4–5) and movement direction across joins.
6. Empty negative space where overlays go: lower 20 % in shots 1–3 (16:9), upper 45 % in shots 4–5.
7. Clean plates: no text, no logos, no symbols, no people in any frame.
