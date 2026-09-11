# fabriccost STUDIO — Textile Fabric Cost Calculator

Polished, installable Progressive Web App for single + multi warp/weft grey fabric costing.

**Author:** Harshvardhan Pareek  
**Stack:** Vite + React + TypeScript + Tailwind CSS + vite-plugin-pwa  
**Target domain:** `harshvardhanpareek.com`

## Features

- Client-side accounts in `localStorage` (Sign in + Create account). Demo `rohitbohara` / `rohitbohara` is seeded; optional `VITE_AUTH_USER` / `VITE_AUTH_PASS` (or `VITE_AUTH_*NAME` / `VITE_AUTH_*PASSWORD`) add another seed.
- Home: fabric name + **Single Warp** / **Multiple Warp / Weft**
- Speak (Web Speech API) or Type input; mic fills current field and advances
- Full cost breakdown with editable inputs + recalculate
- Markup table (5%–16%)
- SEO meta, OG tags, manifest, icons, `robots.txt`, `sitemap.xml`
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
   - `VITE_AUTH_USER` / `VITE_AUTH_PASS` or `VITE_AUTH_USERNAME` / `VITE_AUTH_PASSWORD`
   - `VITE_OWNER_GATE`
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
4. Custom domain: add `harshvardhanpareek.com` in Render → Domains, then point DNS:
   - Apex: A/ALIAS to Render, or CNAME flattening per Render docs
   - `www` CNAME → your Render host

SPA fallback is configured in `render.yaml` (`/*` → `/index.html`).

## Design

Impeccable design context lives in `PRODUCT.md` and `DESIGN.md`. Install the skill with `npx impeccable@latest install --providers=cursor --scope=project` if a teammate needs the command set locally.

## Auth note

Auth is a **simple client-side gate** for convenience — not server security. Account hashes live in `localStorage` (`fabriccost.accounts`). Anyone can inspect the bundle. Replace with real auth before exposing sensitive business data.

## Remaining blockers

- No git remote yet — create one, then `git init && git add . && git commit` and push, then wire Render.
