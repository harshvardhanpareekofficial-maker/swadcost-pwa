# Superdynamic screen redesign — 23 October 2026

Only the user's website-style-library dynamic/VELOX preset is applied. This replaces the previous long landing-page design. The saved VELOX reference informs a product stage with giant typography, a real 3D subject, atmosphere, product selection and compact controls; this is an original adaptation, not a copy of its assets.

## Screens and navigation

- Homepage: one viewport, CCTV Counter / Calculator selection, one primary destination per product.
- Downloads: Windows / Apple-silicon Mac tabs, requirements / limits / checksum detail tabs. Existing verified preview filenames and limitations remain. No full-app claim.
- Calculator: compact account screens, construction and entry-method selection, four numeric fields per step, complete paginated results. Print output includes all pages.
- Help: short factual steps with Previous / Next.
- Private owner ledger: unchanged authentication, expiry and report data functions; section tabs and three records per page replace the long lists. No public owner navigation.
- The 480px-height accessibility fallback permits scrolling for virtual keyboards, zoom and unusually short screens. Ordinary tested portrait phone and desktop sizes fit the viewport. Content accessibility takes priority over clipping.

## Visual system

Archivo Variable; charcoal #111b1b, warm-white copy, lime #b9f574, muted blue for the fabric variant. Flat borders and concise controls, no testimonial or feature-card padding. Motion stays inside the 3D stage; reduced-motion users retain manual controls.

## Asset inventory

| Asset | Origin | Use / limits |
|---|---|---|
| public/models/cctv-concept.glb | Original locally authored mesh; scripts/create-camera-model.mjs | Rounded unbranded white security camera, small recessed blue lens, swivel mount, soft neutral lighting. Illustrative product, no hardware or accuracy claim. 649,980 bytes. |
| public/models/woven-cloth.glb | Existing project-owned procedural cloth | Calculator product stage and desktop sign-in illustration. |
| Archivo font files | Existing installed @fontsource-variable/archivo dependency | Existing font licensing retained. |

No third-party camera models, textures, paid assets, credentials or private media were introduced. Lazy GLB/Three loading, pixel ratio cap, 30fps cap, paused/hidden render suppression, SVG fallback and disposal keep the subject separate from navigation. All navigation and input remain HTML.

## Verification

See qa/redesign-20261023.md for actual checks and scope. The local-only qa/screen-preview.html fixture mounts real calculator page components with synthetic sample values. It is not a production build entry and does not write accounts or telemetry.
