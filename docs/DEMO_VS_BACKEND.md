# Implemented demo behaviour vs. features that need a backend

SHADOW GATE is a **front-end classwork build**. Everything below runs entirely in the visitor's browser. Nothing is sent
anywhere, and the site never pretends otherwise.

| Feature | What the demo really does | What a production version would need |
|---|---|---|
| Request form (#contact) | Validates fields, then saves the request to `localStorage` (`sg-demo-requests`) and shows **"Demo request saved in this browser. No message has been sent."** | A form endpoint or CRM (e.g. serverless function + email provider), spam protection, consent/privacy notice, data retention policy. |
| Personal-service booking | Validates, saves to `localStorage` (`sg-demo-bookings`), shows "Demo booking saved in this browser. No booking has been made." Slots are generated locally. | Real availability calendar / scheduling API, confirmations, reminders, cancellation. |
| Request basket | Stored in `localStorage` (`sg-basket-v1`), deduplicated, package-aware. | Server-side quote workflow, account or magic-link to retrieve a request. |
| Pricing | Business services are quote-based; personal services show **illustrative classwork prices**. No checkout or payment exists. | Real price list, invoicing / payment provider, taxes, terms. |
| Threat Radar | Locally generated simulated events (seeded PRNG) — labelled **"SIMULATED LIVE DEMO — NOT REAL THREAT INTELLIGENCE"**. Regions are illustrative, not attribution. | A licensed threat-intelligence feed with documented sources, data rights and accuracy limits. |
| Protection simulation | Scripted, illustrative scenarios showing a *conceptual* defensive response. | — (educational content; real outcomes depend on configuration and service scope). |
| Recommendation quiz | Transparent rule-based scoring in `src/lib/quiz.ts`. Guidance only — not a security diagnosis. | Optional: a scoping call with a consultant. |
| Security scans | **None.** The site never scans the visitor's device, network or company. | Any real assessment requires a signed scope and, for penetration testing, ownership or explicit written authorization. |
| Ambient sound | Synthesised in the browser with the Web Audio API (no audio files), muted by default. | — |
| Analytics / cookies | None. Only `localStorage`/`sessionStorage` for preferences and demo data. | Consent management if analytics were added. |

To wipe all demo data: use "Clear saved demo data" in the request confirmation, or clear site data in the browser.
