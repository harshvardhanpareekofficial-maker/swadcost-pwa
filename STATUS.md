# SwadCost PWA — STATUS

**Path:** `/workspace/swadcost-pwa`  
**Date:** 2026-09-11 (Asia/Calcutta)  
**Verify:** `npm test` ✅ 16/16 · `npm run build` ✅ (`dist/` + PWA service worker)

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

## Fix 2026-09-11 — absurd Final Cost from zero defaults

Live site ran Calculate with junk/zero reed + bad weft rates (smoke-test residue). Changes:

1. `emptySingle` / `emptyMulti` now seed **DEMO_SINGLE / DEMO_MULTI** (Reed 80, RS 60, L2L 2, counts 40, rates 300/280, pick 50, wastage 5, majuri 10, warping 0; multi yarn1 100%). First Calculate on Single → **1698.77** with no edits.
2. `validateSingleInputs` / `validateMultiInputs` run in `App.tsx` and `ResultsPage` before calculate — required fields must be > 0; multi active yarns need count>0 and finite rates; % shares ~100. Clear error, no navigate.
3. `calculateSingle` / `calculateMulti` throw if reed/reedspace → totalEnds 0, or pick/weft RS is 0.
4. CalculatorPage: **Load demo sample** button.

## How to run

```bash
cd /workspace/swadcost-pwa
npm install
npm test
npm run build
npm run dev      # or: npm run preview
```

Default login: `rohitbohara` / `rohitbohara`

## Deploy / push blockers

1. **No git remote** — `git remote -v` empty. `gh` not logged in (`gh auth status` → not logged into any GitHub hosts).
2. Local commit is on `main`; push needs GitHub repo + credentials (browser session / `gh auth login` / PAT), then parent can use computerUse to upload if needed.
3. Point `harshvardhanpareek.com` DNS at Render after the static site exists.
4. Auth is client-side only (UX gate, not secrecy).
5. Multi K fitted to yarn1-only oracle; re-scrape if multi-yarn server totals diverge.

### Push instructions (when unblocked)

```bash
cd /workspace/swadcost-pwa
gh auth login   # or configure credential helper
gh repo create harshvardhanpareek/swadcost-pwa --private --source=. --remote=origin --push
# OR if repo already exists:
git remote add origin https://github.com/<owner>/swadcost-pwa.git
git push -u origin main
```

Then redeploy Render/static host from that remote.
