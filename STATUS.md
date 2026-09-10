# SwadCost PWA — STATUS

**Path:** `/workspace/swadcost-pwa`  
**Date:** 2026-09-10 (Asia/Calcutta)  
**Verify:** `npm test` ✅ 9/9 · `npm run build` ✅ (`dist/` + PWA service worker)

## Built

- Vite + React 19 + TypeScript + Tailwind v4 + vite-plugin-pwa
- Client login gate (`rohitbohara` / `VITE_AUTH_*`), `localStorage` session
- Flow: Login → Home (fabric name + **Single Warp** / **Multiple Warp / Weft**) → Speak|Type → Fields → Results
- Speak: Web Speech API fills current field and advances
- Results: breakdown, markups 5–16%, edit + recalculate
- Footer “Made by Harshvardhan Pareek” on every page (`Layout` → `Footer`)
- SEO: meta/OG/theme-color, `robots.txt`, `sitemap.xml`, PNG/SVG icons
- Deploy aids: `render.yaml`, `.env.example`, `README.md`
- Formulas: `K_SINGLE=71.59056591483743` → **1698.77**; `K_MULTI=82.12366778293267` → **1482.17**
- Docs: `/workspace/fabric-cost-notes/FORMULAS.md`

## How to run

```bash
cd /workspace/swadcost-pwa
npm install
npm test
npm run build
npm run dev      # or: npm run preview
```

Default login: `rohitbohara` / `rohitbohara`

## Deploy blockers

1. **No git remote yet** — `git init`, commit, push to GitHub/GitLab/Bitbucket/Origin, connect Render static site (`npm ci && npm run build` → publish `dist`).
2. Point `harshvardhanpareek.com` DNS at Render after the static site exists.
3. Auth is client-side only (UX gate, not secrecy).
4. Multi K fitted to yarn1-only oracle; re-scrape if multi-yarn server totals diverge.

## Overnight update (2026-09-10 ~23:40 IST)
- Local git: `main` @ `62da4cc`
- Origin CloudAgent: still blocked (no Origin namespace)
- Render MCP: unauthorized on list_workspaces
- Firebase: cannot create `swadcost-fabric` project; will not overwrite existing sites
- Next human unblock: Origin setup OR GitHub repo + Render auth
