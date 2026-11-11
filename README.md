# SHADOW GATE — cybersecurity service storefront

> *Your gateway to a safer digital world.* · *حمايتك تبدأ من هنا*

A cinematic, scroll-driven storefront for a (fictional, classwork) cybersecurity company, in English and Arabic (RTL).
Visitors travel through a 3D gateway, a threat radar and a service constellation, then shop in a real store:
products read live from a **Supabase** table, sign-up / log-in with **Supabase Auth**, per-user **My Orders**
protected by **Row Level Security**, and online payment with **Stripe Checkout in test mode**.

**Live (Vercel):** https://shadowgate-app.vercel.app · **Also on Netlify:** https://shadow-gate-storefront.netlify.app · **Author:** Soud Alkaban

## Stack

| Layer | What |
|---|---|
| App | Next.js 16 (App Router) + React 19, Tailwind v4, three.js / R3F for the experience |
| Data | **Supabase** (Postgres) — tables `products` (public read) and `orders` (RLS: each user sees only their own rows) |
| Auth | **Supabase Auth** (email + password) → server issues an HttpOnly `SameSite=Lax` session cookie; checked on every protected page/API |
| Payments (Day 5) | Stripe Checkout, **test mode only** — server route creates the session, webhook saves paid orders |
| Hosting | Vercel (imported from this GitHub repo — every push to `main` redeploys) and Netlify |

## Day 4 — database (Supabase)

| Brief | Shadow Gate |
|---|---|
| Supabase project + keys kept out of the code | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in server env only (`.env.local` / Netlify / Vercel) |
| `products` table with sample products | `public.products` — 12 services (English + Arabic). Schema: [`supabase/migrations/`](supabase/migrations/20261111000000_shadow_gate.sql), data: [`supabase/seed.sql`](supabase/seed.sql) |
| Store reads products from Supabase, not hardcoded | [`lib/catalog.ts`](lib/catalog.ts) → `GET {SUPABASE_URL}/rest/v1/products` on every page render (no catalog in the app code) |
| Sign-up / log-in with Supabase Auth | [`app/api/auth/signup`](app/api/auth/signup/route.ts) creates the Supabase Auth user; [`app/api/auth/login`](app/api/auth/login/route.ts) checks the password with Supabase Auth (`grant_type=password`) |
| Bonus: per-user table | `public.orders` with RLS policy `auth.uid() = user_id`; the server also filters every query by the signed-in user's id |
| Bonus: user in the navbar | The nav shows the signed-in user's name (Supabase `user_metadata.name`, or the email's name part if none) |

Quick setup: Supabase → **SQL Editor** → paste [`supabase/setup.sql`](supabase/setup.sql) (schema + seed) → **Run**.

## Day 5 — payments (Stripe test mode)

| Brief | Shadow Gate |
|---|---|
| Supabase Edge Function starts the payment | `POST /api/checkout` (Next.js server route) — needs a login, prices read from the Supabase `products` table |
| Stripe secret key in Supabase Secrets | `STRIPE_SECRET_KEY` in server env only (`.env.local` / Netlify / Vercel env vars) — never in the browser |
| Save the order in the `orders` table after payment | Supabase `orders` table: saved with `status = 'paid'` only after Stripe confirms the session |
| Show "Paid ✓" without reloading | `/checkout/success` confirms with `POST /api/checkout/confirm` from the page and shows **تم الدفع ✓ / Payment successful ✓** |

Flow: **Cart → Pay now → Stripe Checkout (test) → /checkout/success (order saved as Paid) → My Orders**.
Cancelling on Stripe returns to `/checkout/cancel` (nothing charged, nothing saved).

- Only fixed-price services are paid online; quote-based services stay a quote request (Stripe cannot charge 0).
- The browser sends slugs + quantities only. Amounts, currency, user id and the paid lines are written by the
  server into the Checkout Session; after payment the server checks Stripe's `amount_total` against them.
- `POST /api/stripe/webhook` (bonus) verifies the `Stripe-Signature` HMAC over the raw body (400 if invalid) and saves
  the paid order too. `orders.stripe_session_id` is unique, so the webhook and the success page never create two orders.
- Live keys (`sk_live_…`) are refused — classwork runs in test mode only.
- No `stripe` npm package: the server calls Stripe's REST API with `fetch` and verifies webhooks with `node:crypto`.

Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

## Run it locally

Requirements: Node.js 20.19+ (tested with Node 24) and npm.

```bash
npm install
```

Copy `.env.example` to `.env.local` and fill in the values (never commit it — `.env*` is git-ignored):

| Variable | Used for |
|---|---|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_ANON_KEY` | Publishable / anon key (public reads + password log-in; RLS applies) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret / service_role key — server only (creates accounts, reads/writes orders) |
| `JWT_SECRET` | Signs the session cookie (server only) |
| `STRIPE_SECRET_KEY` | Stripe **test** secret key `sk_test_…` (server only) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret `whsec_…` of the `/api/stripe/webhook` endpoint (server only) |

```bash
npm run seed
```

```bash
npm run dev
```

Open http://localhost:3190.

| Script | Purpose |
|---|---|
| `npm run dev` | Next.js dev server (port 3190) |
| `npm run build` / `npm start` | Production build / serve it (port 4190) |
| `npm run seed` | Upserts the 12 services into the Supabase `products` table (or paste `supabase/seed.sql`) |
| `npm run db:check` | Read-only Supabase check: settings present, product count, anonymous visitors see 0 orders |
| `npm test` | Unit tests (Vitest): validation, sessions, Supabase helpers, Stripe signature/metadata/fulfilment rules, i18n… |
| `npm run test:e2e` | End-to-end tests (Playwright, desktop + mobile) against the production build |

## Deploy

Vercel (imported from GitHub) and Netlify (`netlify.toml`: `npm run build:netlify`) both build this repository. Set
the variables above in each host's **Environment variables**. In Stripe (test mode) add a webhook endpoint
`https://<site>/api/stripe/webhook` for `checkout.session.completed` and put its signing secret in
`STRIPE_WEBHOOK_SECRET`.


## Useful URL switches (testing & review)

| Switch | Effect |
|---|---|
| `?intro=1` / `?intro=0` | Force / skip the welcome gate (normally shown once per browser session) |
| `?static=1` or `?webgl=0` | Static experience — what visitors without WebGL get |
| `?motion=reduced` / `?motion=full` | Override `prefers-reduced-motion` (also toggle in the nav) |
| `?quality=low\|medium\|high` | Force a 3D quality tier |
| `?lang=ar` | Start in Arabic (RTL); the nav toggle switches live |
| `#catalog`, `#packages`, … | Deep links bypass the cinematic entrance |

## Project map

```
src/
  App.tsx                 page composition + scroll system bootstrap
  styles/                 tokens.css (brand tokens), base.css (shared UI primitives)
  brand/                  original SVG logo (Logo.tsx) + colour constants
  i18n/                   typed EN/AR dictionaries (Arabic is type-checked against English)
  data/                   services, packages, categories (bilingual content model)
  state/                  zustand stores: basket (persisted), ui overlays, catalog filters, radar, experience mode
  lib/                    choreo.ts (scroll → world timeline), smoothScroll.ts (Lenis + ScrollTrigger), geo, search,
                          quiz, validation, threat simulation, storage, capabilities
  three/                  the single WebGL scene: gate, particles→globe, threat arcs, network layers, constellation,
                          build structure, horizon gate, camera rig, post-processing
  sections/               Welcome, Hero, Radar, Layers, Simulation, Constellation, Catalog, Quiz, Packages, Build,
                          Personal, Contact, BrandAbout, Footer
  overlays/               service details dialog, basket drawer, booking dialog
docs/                     brand guide, classwork checklist, demo-vs-backend note, references, build brief
ad-package/               12-second AI advertisement production package (Google Flow) — render pending
e2e/                      Playwright tests
scripts/                  landmask generator, screenshot helper
```

## How the scroll story works

One coordinated scroll model: Lenis smooths wheel input (cinematic mode only) and drives GSAP ScrollTrigger. The page's
scroll position is mapped piecewise-linearly onto a continuous **world timeline `T`** using DOM anchors
(`src/lib/choreo.ts`). The 3D camera, particle morphs, protection layers and constellation focus are pure functions of
`T`, so scrolling backwards reverses every transition exactly. Sticky sections use CSS `position: sticky` (no pin
spacers), and DOM text choreography uses section-local ScrollTrigger progress.

Accessibility fallbacks: reduced motion or missing WebGL switches to a **static experience** (`html[data-mode=static]`):
no canvas, no scroll-scrubbed motion, every scene rendered as readable content with static SVG art. The 3D scene is
never the only way to find or select a service.

## Brand & classwork documents

- [docs/BRAND_GUIDE.md](docs/BRAND_GUIDE.md) — identity, logo, palette, typography, voice
- [docs/CLASSWORK_CHECKLIST.md](docs/CLASSWORK_CHECKLIST.md) — every assignment requirement mapped to where it is implemented
- [docs/DEMO_VS_BACKEND.md](docs/DEMO_VS_BACKEND.md) — what is simulated vs. what would need a backend
- [docs/REFERENCES.md](docs/REFERENCES.md) — reference-site study and asset sources
- [ad-package/README.md](ad-package/README.md) — 12-second advertisement package

## Assets & licences

All 3D geometry, particles, textures, sounds and the logo are procedural/original. Fonts: Manrope, Tajawal and JetBrains
Mono via Fontsource (SIL Open Font License). Icons: lucide (ISC). Globe land dots: Natural Earth 1:110m land (public
domain) via the `world-atlas` package, pre-baked into `src/lib/landmask.ts`.
