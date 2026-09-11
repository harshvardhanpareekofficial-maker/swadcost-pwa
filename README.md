# fabriccost STUDIO — Textile Fabric Cost Calculator

Polished, installable Progressive Web App for single + multi warp/weft grey fabric costing.

**Author:** Harshvardhan Pareek  
**Stack:** Vite + React + TypeScript + Tailwind CSS + vite-plugin-pwa  
**Target domain:** `harshvardhanpareek.com`

## Features

- Client-side accounts in `localStorage` (Sign in + Create account). Fresh installs start empty — there is no baked-in demo user.
- Home: fabric name + **Single Warp** / **Multiple Warp / Weft**
- Speak (Web Speech API) or Type input; mic fills current field and advances
- Full cost breakdown with editable inputs + recalculate
- Markup table (5%–16%)
- SEO meta, OG tags, manifest, icons, `robots.txt`, `sitemap.xml`
- IndexNow key at the site root so Bing/Yandex/etc. can be notified of the homepage
- Footer on every page: *Made by Harshvardhan Pareek*

## Local development

```bash
cd swadcost-pwa
cp .env.example .env   # optional
npm install
npm run dev
```

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm test` | Vitest (notebook warp-weight 0.082 + costing / auth / telemetry) |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run indexnow` | POST the homepage to https://api.indexnow.org/indexnow (after the key file is live) |

## Formula

Mill-sheet notebook (owner handwritten):

- **Warp weight** = `(ReedSpace × Reed × 120) / (1825 × WarpCount × L2L)`
  - Example: 65 × 120 × 120 / (1825 × 61 × 102) = **0.082**
- **Weft weight** = `(ReedSpace × Pick) / (1693.33 × WeftCount)` × `(1 + wastage%/100)`
- **Sizing** = warp weight × sizing rate
- **Job rate** = Pick × pick rate

See [`FORMULA_CROSSCHECK.md`](FORMULA_CROSSCHECK.md) for the live SwadCost demo comparison (1698.77). The mill notebook is the engine; the old K-fit is not restored.

## Deploy on Render (static site)

1. Push this repo to GitHub/GitLab/Bitbucket (or Origin) and connect the remote.
2. Create a **Static Site** on [Render](https://render.com) (or use `render.yaml`):
   - **Build command:** `npm ci && npm run build`
   - **Publish directory:** `dist`
3. Optional env vars (baked in at build time):
   - `VITE_OWNER_GATE`
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
4. Custom domain: add `harshvardhanpareek.com` in Render → Domains, then point DNS:
   - Apex: A/ALIAS to Render, or CNAME flattening per Render docs
   - `www` CNAME → your Render host

SPA fallback is configured in `render.yaml` (`/*` → `/index.html`). Render serves a real file when it exists, so `robots.txt`, `sitemap.xml`, and the IndexNow key file are not rewritten to the SPA shell.

## IndexNow

Vite copies everything in `public/` to the site root, so the ownership key is served at:

`https://harshvardhanpareek.com/e792e9188ca94764b14f9524069ecac1.txt`

The file body is that same key on one line.

After the key is live on production, notify Bing/Yandex (and other IndexNow engines) of the homepage:

```bash
npm run indexnow
# or inspect the JSON without submitting:
node scripts/ping-indexnow.mjs --dry-run
```

That POSTs to `https://api.indexnow.org/indexnow` with:

```json
{
  "host": "harshvardhanpareek.com",
  "key": "e792e9188ca94764b14f9524069ecac1",
  "keyLocation": "https://harshvardhanpareek.com/e792e9188ca94764b14f9524069ecac1.txt",
  "urlList": ["https://harshvardhanpareek.com/"]
}
```

A `200` or `202` means the endpoint received the URL. Do not ping until the key file is deployed; search engines fetch `keyLocation` to prove ownership.

## Design

Impeccable design context lives in `PRODUCT.md` and `DESIGN.md`. Install the skill with `npx impeccable@latest install --providers=cursor --scope=project` if a teammate needs the command set locally.

## Auth note

Auth is a **simple client-side gate** for convenience — not server security. Account hashes live in `localStorage` (`fabriccost.accounts`). Anyone can inspect the bundle. Replace with real auth before exposing sensitive business data.

New browsers start with an empty account list. A one-time local epoch wipe drops historic seeded users from existing devices.

## Idle account purge (12 days)

Each account stores `lastActiveAt` / `last_active_at`. The stamp updates on successful **sign-in** and successful **Calculate**.

On every app load the client:

1. Removes hashed accounts idle longer than 12 days from `localStorage` (and matching local telemetry).
2. Deletes matching rows in Supabase `swadcost_accounts` and `swadcost_calcs`.

Remote deletes only succeed for idle rows (RLS). Apply [`supabase/migrations/20260911_last_active_idle_purge.sql`](supabase/migrations/20260911_last_active_idle_purge.sql) so the `last_active_at` column and policies exist. The owner vault lists last active and notes the 12-day rule. Existing cloud rows are wiped by the coordinator, not by this client.

## Remaining blockers

- No git remote yet — create one, then `git init && git add . && git commit` and push, then wire Render.
