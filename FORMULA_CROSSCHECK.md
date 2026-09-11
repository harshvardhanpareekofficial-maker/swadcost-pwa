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
| Grand if Majuri is omitted (pick rate 0) | **1216.31** |
| Grand if that ₹10 is a flat add-on (pick rate 0, warping 10) | **1226.31** |

Live demo Final Cost: **1698.77**

| Assembly tried | Notebook | Live demo | Gap |
| --- | ---: | ---: | ---: |
| Majuri as pick rate | 1716.31 | 1698.77 | +17.54 (~1%) |
| Majuri omitted | 1216.31 | 1698.77 | −482.46 |
| Majuri as flat ₹10 | 1226.31 | 1698.77 | −472.46 |

The ~1% pick-rate trial is **not** a match. Internals disagree: notebook weft cost is ~₹13 because weft has **no L2L**; the live 1698.77 total is a length-scaled yarn model (the old K fit put weft near ₹587). Restoring K would chase the demo and ignore the mill sheet.

## Notebook worked example (unchanged)

ReedSpace 65", Reed 120, WarpCount 61, L2L 102:

`(65 × 120 × 120) / (1825 × 61 × 102)` = 0.082429… → **0.082** (unit-tested).

## Industry constants vs the mill sheet

Sources checked 2026-09-11: Textile School GSM/yarn indent (`1693.3` = `1_000_000 / 590.5`), Textile Calculations warp/weft (840-yard hank; warp lbs = ends × tape yards / (840 × count)), Textile Trainer woven costing (yarn cost = weight × ₹/kg).

### Weft — agrees

Notebook: `(ReedSpace × Pick) / (1693.33 × WeftCount)` with **no L2L**.

Cotton English count (Ne): 1 hank = 840 yards/lb. Metres of 1 kg of 1s yarn:

`840 × 2.2046 × 0.9144 ≈ 1693.34` (sheet uses **1693.33**)

Equivalent: tex = 590.5 / Ne, so `1_000_000 / 590.5 ≈ 1693.48`. Textile School uses **1693.3** in

`weftKg / 100 m = PPI × width_in × 100 × (1+crimp%) × (1+wastage%) / (1693.3 × Ne)`

Drop length=1 m, crimp=0, wastage=0 → `(PPI × width) / (1693.3 × Ne)`, which is the notebook weft base. We keep 1693.33 and no L2L on weft.

### Warp — disagrees with the textbook kg/m form

Textbook (same sources): warp kg for L metres ≈ `(ends × L × (1+crimp)) / (1693.3 × count)` with **length in the numerator**. Ends = Reed × ReedSpace.

Notebook: `(ReedSpace × Reed × 120) / (1825 × WarpCount × L2L)` with **L2L in the denominator**. Worked example 65 / 120 / 61 / 102 → **0.082** (unit-tested). That is not `(7800) / (1693.33 × 61)` ≈ 0.0755 kg/m.

**1825 / 120 stay as written.** 1825 is close to older mill rounding `840 × 2.17 ≈ 1823` (lb→kg as 2.17 instead of 2.2046); it is **not** 1693.33. The 120 is the sheet numerator (the example also has Reed 120 — coincidence). Do not replace warp with the weft constant.

### Wastage — notebook wins (still industry-shaped)

Textile School inflates **both** warp and weft yarn indent by process wastage. The mill sheet arrows wastage onto the **weft base only**: `weftWeight = base × (1 + %/100)`. Applying it to warp would not match the notebook, so we do not.

### Cost assembly — agrees

Industry: yarn ₹ = weight × yarn rate; grey cost = yarn + conversion. Notebook lists weights and rates separately; we use `warpCost = warpWeight × warpRate` (same for weft), `sizing = warpWeight × sizing rate`, `job = Pick × pick rate`, plus optional flat warping. Some published costing uses weaving ₹ = **width × pick rate**; the sheet says **Pick × pick rate**. We follow the sheet.

Web references do **not** justify restoring the old K-fit (1698.77 / 1482.17).

## Prefills

Calculator forms start at **zeros / empty**. `SWADCOST_LIVE_SAMPLE` is documentation-only. **Load sample** is an explicit fill (notebook warp example plus labeled sample rates).

## Why the engines differ

The demo ASP.NET app and the mill notebook are different costing models. This product follows the owner sheet (120 / 1825 / 1693.33). Owner vault and Supabase analytics are unchanged.
