# 02 · Google Flow (Veo) prompts

**Status:** VIDEO RENDER: PENDING — no video has been generated; this is the production-ready package for Google Flow.
These prompts have not been run yet. Expect to iterate: generate 2–4 takes per shot and pick the best window.

**Rule for all footage: clean plates.** No text, letters, numbers, logos, UI or faces in any shot. The real SVG logo
and all typography are added in editing ([06](06-overlays.md), [07](07-edit-guide.md)). Do **not** upload the logo
files to Flow — AI copies of a logo drift; the gateway's shape is described in words instead ([03](03-continuity.md)).

## Generation settings

| Setting | Value |
|---|---|
| Tool | Google Flow (Veo). Menu names change between releases — use the equivalent option if a name differs. |
| Model | Highest-quality Veo model available to you for finals; the fast variant for exploring compositions |
| Mode | Shot 1: *Text to Video* or *Frames to Video* from ingredient A · Shots 2, 3, 5: *Frames to Video* with the previous shot's last frame as the start frame · Shot 4: *Frames to Video* from ingredient C |
| Aspect | 16:9 master. If your plan offers 9:16, generate a separate vertical set with the framing in [08](08-framing-9x16.md); otherwise reframe the 16:9 master |
| Clip length | Generate the default 8 s clip; each shot uses only a 2–3 s window of it (see *Take windows*) |
| Resolution | 1080p (generate at 1080p or use Flow's upscale before download) |
| Audio | Veo may generate audio. Discard it — the ad uses its own sound design ([05](05-sound-design.md)) |

## Shared style preamble (paste at the start of every prompt)

> Cinematic 3D-rendered commercial shot for a calm, premium cybersecurity brand. Photoreal architectural CGI,
> restrained and precise. A dark architectural space in deep midnight navy (#070B14). A monumental digital
> gateway: a tall rectangular portal frame whose two upper corners are cut at 45 degrees, giving a flat top and a
> chamfered, shield-like silhouette; thick frame of dark gunmetal metal (#1C2638), satin finish, with thin glowing
> electric-teal (#35F2C4) light lines inset along its inner edge. Polished dark floor with fine, faint grid lines;
> light volumetric haze near the floor; sparse slow-drifting dust particles catching teal light. Controlled,
> selective glow, deep clean shadows, crisp detail, atmospheric depth. Colour grade: cool and low-saturation; soft
> white (#F3F6FA) highlights; teal is the only saturated colour unless the shot says otherwise. Smooth, deliberate
> camera motion, natural 24 fps motion blur. Clean surfaces: no text, no letters, no numbers, no symbols, no logos,
> no user interface, no people.

## Negative prompt (use the field if Flow shows one; otherwise append "Avoid: …" to the prompt)

> text, letters, words, captions, subtitles, numbers, watermark, logo, emblem, brand marks, letter S, symbols,
> user interface, HUD, screens with readable content, code, binary digits, matrix rain, padlock icons, skulls,
> hooded hacker, people, faces, hands, human silhouettes, fire, explosions, sparks, smoke plumes, lightning, broken
> glass, sirens, flashing police lights, real brands, product logos, city skyline, spaceship interior, neon pink,
> purple, orange, rainbow colours, heavy bloom, lens-flare overload, glitch effects, chromatic aberration, shaky
> handheld camera, fast cuts, cartoon, anime, low-poly, flat 2D illustration

## Ingredients (make these stills first)

Create three reference stills (Flow's image generation, same preamble, 16:9). Re-use them as start frames and as
*Ingredients to Video* references so every shot shows the same gateway and the same world.

| ID | Still | Prompt addition after the preamble | Used by |
|---|---|---|---|
| **A** | Gateway, exposed | Frontal eye-level view, 35 mm. The gateway stands centred, base in the lower third, open (its opening is dark). One short section of its teal edge light is dim — a single gap in an otherwise continuous line of light. Empty dark floor in front. | Shot 1 start frame; reference for 4–5 |
| **B** | Network interior | Inside a dark calm space: a small glowing teal hub on a low circular dark platform; three floating luminous soft-white nodes in an arc above it, shaped as simple abstract glyphs — a browser window, an envelope, a key — without any text or markings; thin lines of light connect each node to the hub. | Reference (and optional end frame) for shot 2; reference for 3 |
| **C** | Sealed gate, brand hall | Locked-off frontal symmetrical view, 50 mm. A dark, almost empty cathedral-like hall. The same gateway, centred in the lower half of the frame, closed by two flat dark-metal door panels with a thin vertical seam; its outline glows teal. Low floor fog, faint floor grid, soft rim light from behind. The upper half of the frame is dark, empty negative space. | Shot 4 start frame; reference for 5 |

Check each still before using it: no text, no S-shaped symbol on the gate, chamfered top corners visible, teal
edges thin (not neon tubes), floor grid faint.

## Shot prompts

Each prompt below = **preamble + shot text**. Durations refer to the 8 s generated clip; the edit uses only the
window listed under *Take windows*.

### Shot 1 — Hook (cut length 2.0 s · f0–f47)
- **Start frame:** ingredient A (or text-to-video with the same description).
- **Prompt:**
  > SHOT 1, HOOK. Eye-level shot, 35 mm lens, slow steady push-in toward the gateway, which stays centred in
  > frame with its base in the lower third and empty dark floor in front of it. One short section of the
  > gateway's teal edge light is dim and flickering — a single weak gap in an otherwise continuous line of light.
  > From the left side of the frame, low over the floor, a small glowing red point of light (#FF4D5E) with a short
  > fading trail races along a smooth curved path across the floor toward the gateway's threshold, accelerating,
  > leaving faint ripples in the haze. It reaches the threshold around the middle of the clip and casts a small red
  > glow on the floor in the opening. The red point is the only warm light in the scene. Tense but restrained,
  > minimal, no explosion, no sparks.
- **Subject:** the exposed gateway + the red threat pulse. **Environment:** dark architectural space, grid floor,
  haze. **Camera / lens:** eye level, 35 mm, slow push-in. **Lighting:** low-key navy ambient, weak teal edges, one
  small red light source. **Palette:** #070B14, #1C2638, #35F2C4 (dim), #FF4D5E (pulse only). **Motion:** pulse
  accelerates, camera pushes steadily. **Style reference (in words):** the restraint of a premium architectural
  product film — one light moving through a dark set, not a disaster movie.

### Shot 2 — Product (cut length 3.0 s · f48–f119)
- **Start frame:** the last usable frame of the chosen shot 1 take (camera close to the opening).
  Optional end frame: ingredient B.
- **Prompt:**
  > SHOT 2, PRODUCT. Continuous with the previous shot: the camera keeps moving forward and passes through the
  > gateway's opening — the dark metal frame rushes past the edges of the lens and clears — entering a calm, dark
  > interior space. In the centre a minimal floating network resolves: a small glowing teal hub on a low circular
  > dark platform, and three floating luminous soft-white nodes in an arc above it, shaped as simple abstract
  > glyphs — a browser window, an envelope, a key — with no text or markings on them. The nodes light up one after
  > another, each connecting to the hub with a thin line of light. The camera then settles into a slow orbit to
  > the right with a gentle push. Far away at the edge of the darkness a tiny faint red point of light appears and
  > begins drifting toward the network. 35 mm lens. Calm, clear, precise.
- **Subject:** gate pass-through, then hub + website / email / account nodes. **Environment:** dark interior,
  slightly lifted ambience. **Camera / lens:** dolly forward through the gate → slow orbit right, 35 mm.
  **Lighting:** nodes soft-white emissive (#F3F6FA), teal hub (#35F2C4), tiny red (#FF4D5E) far away.
  **Motion:** fast pass-through for the first ~0.5 s of the window, then calm. **Style reference:** a clean product
  explainer rendered like architectural CGI — simple shapes, generous darkness, light used as information.
- **Fallback:** if Veo draws unclear glyphs or any text, prompt the nodes as *plain glowing spheres* and add simple
  line icons in the edit (lucide `app-window`, `mail`, `key-round`, ISC licence, stroke 1.6, soft white).

### Shot 3 — Benefit (cut length 3.0 s · f120–f191)
- **Start frame:** the last usable frame of the chosen shot 2 take.
- **Prompt:**
  > SHOT 3, BENEFIT. Continuous with the previous shot. Three translucent teal protection rings — each an
  > elongated octagon with chamfered corners, echoing the gateway's silhouette — form one after another around the
  > floating network, the outermost last, each snapping into place with a brief brightening of its edge. The small
  > red point of light travels on a curved path toward the network and stops dead at the outermost ring: it dims to
  > a dull ash grey and breaks into a few fading grey particles that drift upward, while a soft teal ripple runs
  > around the ring. The network's nodes shift from soft white to teal. Camera: the slow orbit to the right
  > continues with a slight pull-back to show all three rings. 35 mm lens. Calm, reassuring, controlled; no
  > explosion, no sparks, no flash.
- **Subject:** protection layers + interrupted simulated threat path. **Environment:** same interior, teal
  rising. **Camera / lens:** orbit right + slight pull-back, 35 mm. **Lighting:** teal becomes the key light; red
  goes out at the interruption. **Palette:** #35F2C4, #8AF7DA (ring highlights), #6B7688 (ash), #FF4D5E until the
  interruption only. **Motion:** three staggered lock-ins, then one decisive stop. **Style reference:** the precise,
  mechanical calm of a vault door closing — quiet confidence, not a battle.

### Shot 4 — Brand (cut length 2.0 s · f192–f239)
- **Start frame:** ingredient C (the shot opens from black in the edit, so no continuity with shot 3 is needed).
- **Prompt:**
  > SHOT 4, BRAND. Locked-off frontal symmetrical shot, 50 mm lens, very slow push-in. A dark, almost empty
  > cathedral-like architectural hall. The gateway stands centred in the lower half of the frame, closed: two flat
  > dark-metal door panels fill its opening with a thin vertical seam in the middle. A line of teal light travels
  > around the gateway's chamfered frame until the whole outline glows, then the vertical seam between the doors
  > begins to glow softly. Low fog on the floor, faint fine grid lines on the polished floor, soft rim light from
  > behind the gateway. The upper half of the frame stays dark and empty. Monumental, quiet, premium.
- **Subject:** the sealed gateway as a brand monument. **Environment:** dark hall, fog, grid floor.
  **Camera / lens:** locked-off frontal, 50 mm, ≈4 % push. **Lighting:** rim light from behind, teal emissive edges,
  very low fill. **Palette:** #070B14, #1C2638, #35F2C4, faint #F3F6FA rim. **Motion:** only the travelling edge light
  and the slow push. **Style reference:** a luxury-brand title shot — one object, symmetrical, lit like architecture
  at night. Keep the upper 45 % empty for the logo.

### Shot 5 — CTA (cut length 2.0 s · f240–f287)
- **Start frame:** the last usable frame of the chosen shot 4 take.
- **Prompt:**
  > SHOT 5, CALL TO ACTION. Continuous with the previous shot, same 50 mm lens, same symmetrical framing. The two
  > door panels slide apart sideways, smoothly and symmetrically, revealing beyond the gateway a calm, luminous
  > teal horizon — a soft gradient of teal light over an endless calm plane. A soft path of teal light spreads
  > along the floor from the opening toward the camera. The camera dollies forward slowly and steadily, perfectly
  > centred. The hall brightens gently. Hopeful, calm, open. The upper part of the frame stays dark and clear.
- **Subject:** the gateway opening. **Environment:** hall + teal horizon beyond. **Camera / lens:** symmetrical
  dolly forward, 50 mm, ≈10 %. **Lighting:** teal backlight rising (#35F2C4 → #8AF7DA at the horizon), soft fill on
  the floor path. **Motion:** doors open over ≈1.3 s, then hold. **Style reference:** the final shot of a premium
  architectural film — a door opening onto calm light, nothing dramatic.

## Take windows (what to cut from each 8 s clip)

| Shot | Window to use | Sync point inside the cut |
|---|---|---|
| 1 Hook | The 2.0 s (48 frames) ending 3 frames after the pulse reaches the threshold | Contact on f44 |
| 2 Product | 3.0 s (72 frames) starting as the gate frame begins to rush past the lens | Frame clears the lens by f61; first node lights near f59 |
| 3 Benefit | 3.0 s (72 frames) containing the three lock-ins and the interruption | Interruption on f158 (38 frames into the cut) |
| 4 Brand | 2.0 s (48 frames) starting when the edge light begins to travel | Outline complete by ≈f212 |
| 5 CTA | 2.0 s (48 frames) starting on the first movement of the doors | Doors fully open by ≈f271, then hold |

If an action is too slow, retime the clip up to 150–200 % (optical-flow retiming) rather than regenerating; if it
is too fast, slow down no more than 80 %. Never stretch a clip to fill time.

## Continuity method (frame to frame)

1. **Lock the look on stills first.** Approve ingredients A, B, C before generating any video.
2. **Chain the continuous shots.** 1 → 2 → 3 and 4 → 5 are continuous: export the *exact* last frame you will use
   from the chosen take (full resolution PNG) and use it as the start frame of the next generation. Choose the cut
   point first, then export that frame — not the clip's final frame if you trim earlier.
3. **Repeat the preamble verbatim** in every prompt; only change the shot text.
4. **Keep the same camera language** inside each chain: 35 mm for 1–3, 50 mm for 4–5; push-ins and orbits continue
   in the same direction across a join.
5. **Use ingredients as references** (Ingredients to Video) for shots that drift: A for the gateway, B for the
   network, C for the hall.
6. **Check joins at 100 %:** gateway proportions, edge-light thickness, haze density and grain must match across
   the cut; fix small mismatches in the grade ([07](07-edit-guide.md)), regenerate large ones.

## Seed and take log

Flow's interface may not expose a seed number. If you generate through the Veo API (for example on Vertex AI), set
a fixed seed while iterating on wording — the same prompt, seed and settings usually give a close variation, not
an identical clip. Either way, log every take you keep:

| Shot | Take ID / file | Model | Seed (if any) | Prompt version | Window used (s) | Notes |
|---|---|---|---|---|---|---|
| 1 | | | | v1 | | |
| 2 | | | | v1 | | |
| 3 | | | | v1 | | |
| 4 | | | | v1 | | |
| 5 | | | | v1 | | |

## Review each take for

- any text, letters, numbers, symbol, logo or S-shape → reject;
- people, faces, hands → reject;
- fire, explosions, sparks, sirens or "hacker" imagery → reject;
- red anywhere except the threat pulse (shot 1–3) → reject or grade out;
- gateway silhouette not chamfered, or edges turned into thick neon tubes → regenerate;
- camera judder or warping geometry at the cut point → choose another window or regenerate.
