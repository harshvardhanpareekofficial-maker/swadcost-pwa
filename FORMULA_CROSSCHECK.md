# Formula cross-check: mill notebook vs SwadCost demo

**Date:** 2026-09-11  
**Live demo:** https://swadcost.pareektech.com (signed in as `rohitbohara`)  
**Decision:** Keep the handwritten notebook as the engine. Do **not** restore the old empirically fitted K constants (`K_SINGLE ≈ 71.59` / `K_MULTI ≈ 82.12`).

## What was posted to the live demo

`Admin/Costing.aspx` fields start empty except Wastage `5` and Warping `0`. The historical sample that produced **Final Cost 1698.77** is:

| Field | Value |
| --- | --- |
| Reed | 80 |
| Warp count | 40 |
| Warp reedspace | 60 |
| Warp yarn price | 300 |
| L2L | 2 |
| Pick | 50 |
| Weft count | 40 |
| Weft reedspace | 60 |
| Weft yarn price | 280 |
| Wastage | 5 |
| Majuri | 10 |
| Sizing | 5 |
| Warping | 0 |

**Live result (POST, 2026-09-11):** Final Cost **1698.77**. Markup 5% = 1783.71, 16% = 1970.57.

`Admin/MultiCosting.aspx` yarn-1 only (warp/weft 100% / count 40 / rates 300 & 280, yarn 2–3 zeroed, same reed / RS / L2L / pick / wastage / majuri / sizing) returned **1698.77** on this date — the same total as single. The older PWA oracle **1482.17** was a fitted `K_MULTI` scale, not what the live form returned for these inputs today.

## Notebook engine (what this app ships)

- Warp weight = `(ReedSpace × Reed × 120) / (1825 × WarpCount × L2L)`
- Weft base = `(ReedSpace × Pick) / (1693.33 × WeftCount)`
- Weft weight = base × `(1 + wastage%/100)`
- Sizing = warp weight × sizing rate
- Job = Pick × pick rate
- Yarn cost = weight × yarn rate
- Grand total = warp + weft + sizing + job + warping

Same constants on the multi-yarn path, split by yarn %.

## Same live-demo inputs through the notebook

Warp weight = `(60 × 80 × 120) / (1825 × 40 × 2)` = **3.945205…**  
Weft base = `(60 × 50) / (1693.33 × 40)` = **0.044291…**  
Weft after 5% = **0.046506…**

| Line | Notebook ₹ |
| --- | ---: |
| Warp × 300 | 1183.56 |
| Weft × 280 | 13.02 |
| Sizing × 5 | 19.73 |
| Job if Majuri is pick rate (50 × 10) | 500.00 |
| Grand (Majuri → pick rate) | **1716.31** |
| Grand if Majuri is a flat ₹10 add-on (pick rate 0) | **1226.31** |

Live demo Final Cost: **1698.77**

| Assembly tried | Notebook | Live demo | Gap |
| --- | ---: | ---: | ---: |
| Majuri as pick rate | 1716.31 | 1698.77 | +17.54 (~1%) |
| Majuri as flat ₹ | 1226.31 | 1698.77 | −472.46 |

The ~1% pick-rate trial is **not** a match. Internals disagree: notebook weft cost is ~₹13 because weft has **no L2L**; the live 1698.77 total is a length-scaled yarn model (the old K fit put weft near ₹587). Restoring K would chase the demo and ignore the mill sheet.

## Notebook worked example (unchanged)

ReedSpace 65", Reed 120, WarpCount 61, L2L 102:

`(65 × 120 × 120) / (1825 × 61 × 102)` = 0.082429… → **0.082** (unit-tested).

## Prefills

Calculator forms start at **zeros / empty**. `SWADCOST_LIVE_SAMPLE` is documentation-only. **Load sample** is an explicit fill (notebook warp example plus labeled sample rates).

## Why the engines differ

The demo ASP.NET app and the mill notebook are different costing models. This product follows the owner sheet (120 / 1825 / 1693.33). Owner vault and Supabase analytics are unchanged.
