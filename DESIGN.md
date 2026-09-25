---
name: "fabriccost STUDIO"
description: "Fabric / Form: a calm textile costing studio with material depth."
colors:
  deep-teal: "#062c2d"
  forest: "#174e43"
  lime: "#c4ec77"
  sage: "#426b59"
  ink: "#102d29"
  ivory: "#f4f7f2"
  paper: "#ffffff"
  cream: "#e8eee3"
  muted: "#52695f"
  divider: "#c6d3c8"
  rose: "#ac3343"
typography:
  display:
    fontFamily: "Archivo Variable, Segoe UI, sans-serif"
    fontSize: "clamp(58px, 6.25vw, 96px)"
    fontWeight: 650
    lineHeight: 0.99
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Archivo Variable, Segoe UI, sans-serif"
    fontSize: "clamp(30px, 3.2vw, 46px)"
    fontWeight: 550
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Archivo Variable, Segoe UI, sans-serif"
    fontSize: "15px"
    lineHeight: 1.8
  label:
    fontFamily: "Archivo Variable, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.16em"
rounded:
  field: "7px"
  button: "8px"
  sheet: "10px"
  banner: "12px"
  pill: "40px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "28px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.button}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.deep-teal}"
  button-secondary:
    backgroundColor: "#ffffffcc"
    textColor: "{colors.forest}"
    rounded: "{rounded.button}"
    padding: "12px 16px"
  button-ghost:
    textColor: "{colors.muted}"
    rounded: "{rounded.button}"
    padding: "12px 16px"
  hero-action:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.deep-teal}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
  numeric-input:
    backgroundColor: "#fafcf8"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
  sheet:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.sheet}"
---

# Design System: fabriccost STUDIO

## Overview

**Creative North Star: "Fabric / Form"**

A considered textile studio: strong Archivo typography, deep teal framing, lime emphasis and a pale sage working canvas. Kailash Urja supplies the editorial scale and spacing; the super-dynamic direction supplies one real cloth study. The user explicitly asked for simple, restrained motion, not movement everywhere or an over-engineered interface.

The entrance introduces the material and the task; calculator, results and private owner ledger prioritize readable numbers and stable controls. This is one responsive web PWA, also bundled in a Capacitor APK wrapper. The wrapper does not introduce a separate native visual system.

The confirmed direction in `docs/dynamic-direction.md` supersedes PRODUCT.md's earlier color and entrance-composition restrictions. Its remaining product, accessibility, authentication and brand constraints remain in force. This document records the implemented system in `src/index.css` and the current components; legacy CSS names such as plum and indigo now resolve to green/teal values and are not alternative palettes.

**Key Characteristics:**
- Editorial headings with clear numeric hierarchy.
- Open working surfaces and fine dividers instead of nested cards.
- One interactive fabric study with a static fallback.
- Touch-friendly controls and operating-system reduced-motion support.

## Colors

### Primary

Deep teal frames navigation, the entrance stage and the final cost. Forest carries operative buttons and strong form accents. Lime marks the entrance action, selected scene material and the final figure.

### Secondary

Sage supports subtle material accents and completion states. Rose is reserved for errors and actionable problems.

### Neutral

Ivory is the working canvas; paper is the form surface; cream supports quiet grouping. Ink carries primary text, muted carries explanatory text, and divider separates rows without heavy boxing. The frontmatter owns the exact values. Material swatches are illustrative Natural, Sage and Slate colors, not status indicators.

## Typography

Archivo Variable is self-hosted through `@fontsource-variable/archivo` in `src/main.tsx`, with Segoe UI and sans-serif fallbacks. Display and body share this family. Variable weights provide hierarchy without a second font or remote font request.

Display type is large and tightly spaced; workspace headlines are smaller and lighter. The hero body uses a short 42-character measure. Compact operational copy commonly uses 12–14px rather than the entrance's 15px body role. Form labels are compact uppercase; numeric inputs are 20px and use tabular numerals. Final-cost figures are 64px on desktop and 52px on phones. Do not add decorative eyebrows above every heading.

## Layout

The entrance uses a full-width dark stage with a 1.12:1 text/object split, 5% side padding and a minimum height of 670px. The cloth occupies the stage, not a floating card. The account section is a separate two-column destination below, with a vertical divider and a form capped at 430px. The process section uses three open columns.

The operating shell fills 100dvh with a fixed-height header, independently scrolling main region and optional bottom action strip. Its main content is capped at 1320px, with desktop padding of 24px 48px 30px. At 1100px, workspace padding drops to 24px and the ledger top region becomes one column. At 1000px and wider, paired yarn fields and cost-sheet panels use two columns.

At 760px and narrower, the entrance and account section stack, the hero headline uses clamp(44px, 10.5vw, 70px), and the cloth stage contracts to 335px. Workspace padding becomes 20px 18px. The compact cloth stage remains beside the construction banner text, with fewer controls; the operational form becomes one column. Header actions and the first primary path remain reachable. Keep existing safe-area handling on applicable footer and action elements. Print removes navigation and controls, expands scrolling containers and prints the cost sheet on white.

## Elevation & Depth

Tonal contrast and dividers supply most depth. Ordinary sheets have no box shadow. The entrance uses a faint radial wash and textile construction lines, while the real cloth provides material depth. Do not reproduce this treatment on every operational panel.

The install-help popover uses `0 12px 30px #102d2920`; the bottom action strip uses `0 -6px 20px #102d2905`. The declared sheet-shadow token exists but standard sheets explicitly disable it. Use popover elevation only for temporary content above the page.

## Shapes

Fields are gently rounded (7px), ordinary buttons use 8px, sheets use 10px and dark banners use 12px. Entrance calls to action are pill-shaped (40px); login submits use 30px and sticky actions use 28px. Scene controls are circular, 44px square. Dividers remain fine and straight. These are observed component roles, not a requirement to make every element equally round.

## Components

### Buttons

Primary operative buttons use forest and ivory, darken to deep teal on hover and keep a minimum 44px touch height (48px at the shared small-screen breakpoint). The entrance primary uses lime and deep teal, lightening on hover. Secondary buttons use a pale surface and subtle forest border; ghost buttons use quiet text. Disabled controls communicate unavailability through opacity and cursor. All interactive elements inherit a visible 3px olive focus outline with 4px offset.

### Inputs / Fields

White account fields have a sage-gray border; numeric fields use a faint off-white background, generous padding and 52px minimum height. Focus darkens the border. Keep password visibility controls and live error messages. Error color must accompany text, not replace an explanation.

### Cards / Containers

White yarn sections have thin borders and 28px padding, reducing to 22px 18px on phones. Construction choices are open rows with bottom dividers and a cream hover state. The final-cost panel uses deep teal and lime. The owner ledger uses the same palette, clear filters and restrained ranking bars; it remains a private authenticated surface.

### Navigation

The dark teal header is 86px tall on desktop and 74px on phones. Navigation is functional and sparse. The entrance action is a lime pill; compact layouts hide the secondary process link. Workspace headers show contextual actions without repeating a workspace eyebrow above the page heading.

### Fabric Study

`FabricStage` lazy-loads `ClothCanvas`, which loads the actual `/models/woven-cloth.glb` through Three.js. An original procedural weave texture, soft lights and three illustrative swatches describe material; there is no connection to costing values. Horizontal drag and labelled left/right buttons adjust rotation. A pause control stops idle motion. The canvas is hidden from assistive technology while the surrounding controls retain accessible labels and pressed states.

The static `LoomVisual` remains available until the GLB is ready, and is restored after loading or WebGL failure. Scene-only controls are hidden when unavailable. The renderer caps pixel ratio at 1.5, throttles to roughly 30fps, and skips rendering offscreen or when the document is hidden. Paused and reduced-motion modes render only when inputs or size change. No post-processing or real-time shadow system is required.

Motion is restrained: fields transition over 160ms, row hovers over 180ms, the entrance action over 200ms and workspace opacity arrives over 220ms. The fallback crossfade is the existing 400ms exception. The operating-system reduced-motion preference disables CSS transitions, animations and smooth scroll, and prevents cloth idle movement; explicit inspection controls remain usable. Do not describe the current implementation as universally below 300ms.

## Do's and Don'ts

### Do:
- Do keep calculation fields stable and labels legible on small screens.
- Do retain visible keyboard focus, accessible labels and meaningful error recovery.
- Do preserve formulas, units, rounding, account behavior and the authenticated private owner dashboard.
- Do keep fabriccost branding and the Made by Harshvardhan Pareek footer.
- Do treat the fabric study as illustrative, independent of calculation inputs.

### Don't:
- Don't spread scene motion into calculator controls or add scroll-driven choreography.
- Don't revive the obsolete indigo/orange palette or Space Grotesk/Manrope type system.
- Don't add generic SaaS purple gradients, nested gray cards or unrelated biogas imagery.
- Don't expose the owner dashboard through public navigation or change access controls during visual work.
