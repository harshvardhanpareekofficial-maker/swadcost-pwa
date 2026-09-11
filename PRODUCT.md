# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Indian powerloom and fabric-costing operators (inferred from the owner brief) who need a fast, installable calculator on phone or shop-floor tablet. Secondary audience: the owner, who reviews account and quality usage in a private vault.

## Product Purpose

fabriccost STUDIO turns warp, weft, and making charges into a considered cost sheet: name a fabric, choose Single or Multiple yarns, speak or type inputs, then read a full breakdown with editable recalculation. Success is a trustworthy Final Cost the user can act on the same sitting.

## Positioning

A textile-first costing studio, not a generic SaaS calculator. The mechanism is mill-sheet grey-fabric math from the owner notebook (warp 1825 / weft 1693.33) plus voice fill and an installable PWA at harshvardhanpareek.com.

## Operating Context

Static site on Render. Client-side accounts in localStorage. Optional Supabase analytics for account metadata and calculate events. Shop lighting, one-handed phone use, and rupee-denominated rates are the real scene.

## Capabilities and Constraints

- Sign in / Create account only (hashed passwords, empty local store — no demo seed). No guest / “explore first” path.
- Costing math follows the owner mill notebook (warp weight example 0.082). Do not reintroduce the old K-constant SwadCost fit.
- Secret owner vault (not `/admin`) gated by `VITE_OWNER_GATE`.
- Analytics tables keep backend names `swadcost_accounts` / `swadcost_calcs`; never surface that brand in UI.
- No backend auth. Filesystem is ephemeral.

## Brand Commitments

- Visible product name: **fabriccost** / **fabriccost STUDIO** only.
- Footer on every page: “Made by Harshvardhan Pareek”.
- Zero “SwadCost” / “swadcost” in UI, titles, headers, meta, manifest, OG/Twitter.
- Voice: considered, premium studio. Calm, precise, rupee-aware.
- Binding visual constraints from owner: studio login structure (split brand + card); creative palette not teal/navy; anti-refs: generic SaaS purple gradients, Inter-everywhere, nested gray cards.

## Evidence on Hand

- Live site: https://harshvardhanpareek.com/
- Formula fixtures in `src/lib/costing.test.ts`

## Product Principles

- Account every thread and rupee without theatre.
- One studio language from login through results — never a second “app theme”.
- Trust lives in readable numbers and honest errors.
- Shop-floor first: large targets, show/hide password, voice optional.
- Owner analytics stay quiet: secret path, no passwords in shared storage.

## Accessibility & Inclusion

WCAG AA contrast on paper surfaces. Touch targets ≥44px. Keyboard-visible focus. Form errors name the problem and the recovery.
