---
name: fabriccost STUDIO
description: Considered textile costing studio — paper, plum, saffron, never generic SaaS.
colors:
  ink: "#1A1423"
  plum: "#3B1F4A"
  plum-deep: "#2A1534"
  saffron: "#E8A838"
  ivory: "#F7F1E8"
  paper: "#FFFBF4"
  rose: "#9B2C2C"
  ready: "#2F7A4A"
typography:
  display:
    fontFamily: "Fraunces, Iowan Old Style, Palatino, Georgia, serif"
    fontSize: "clamp(2.25rem, 6vw, 3.5rem)"
    fontWeight: 650
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Fraunces, Iowan Old Style, Palatino, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 650
    lineHeight: 1.15
  body:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.16em"
    textTransform: uppercase
  data:
    fontFamily: "IBM Plex Sans, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    fontFeatureSettings: "tnum"
rounded:
  sm: "8px"
  md: "14px"
  lg: "24px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "32px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.plum}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.md}"
    padding: "14px 20px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.plum}"
    rounded: "{rounded.md}"
    padding: "14px 20px"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
---

## Overview

fabriccost STUDIO is a mill-office on warm paper: ivory canvas, plum ink, saffron as the single accent. Login is Persuade (split brand + elevated card). Every later screen is Operate on the same paper — not a dark “app mode.” Wordmark is always `fabriccost` + small-caps `STUDIO`. Attribution is always “Made by Harshvardhan Pareek.”

## Colors

- **Ivory** is the page. **Paper** is an elevated sheet (white-warm, not gray).
- **Plum** owns identity and the primary action. Never a purple-to-blue gradient.
- **Saffron** is rare: wordmark qualifier, focus, one active step, one status thread.
- Neutrals are plum-tinted. No cool gray body text.
- Errors are rose on a warm wash. Ready-status is a small green dot only.

## Typography

- **Fraunces** (optical size) for display and page titles.
- **IBM Plex Sans** for UI, labels, and tabular rupees.
- Label role: 11px, 600, 0.16em uppercase, plum/70.
- Do not use Inter, Arial, or a system-only display face as the voice.

## Layout

- Login: top bar / split main / left footer. Mobile stacks brand above the card.
- App: max 36rem column, generous vertical rhythm, proximity over extra wrappers.
- One primary CTA per view. Secondary actions are quieter text or outline sheets.

## Elevation & Depth

- One lifted sheet: white-warm card, offset shadow `0 18px 40px rgba(26,20,35,0.10)`.
- No nested cards. No glassmorphism. No halo-only shadows.

## Shapes

- Fields 14px radius. Sheets 24px. Pills only for the stepper disc.
- Weave graphic is orthogonal bars (warp/weft), never a stock hero illustration.

## Components

- **Primary button:** full-width plum, ivory type, trailing arrow on auth only.
- **Field:** labeled, paper fill, plum border at 15% opacity; focus = saffron ring.
- **Choice row:** paper sheet, drawn SVG mark, title + one-line help. Not icon-tile cards.
- **Stepper:** four named stages; saffron disc on the current step.

## Do's and Don'ts

- Do keep login structure from the studio mockup (including small-caps lines the owner specified).
- Do keep the same tokens on Home, Speak/Type, calculator, results, and owner vault.
- Don't introduce a second dark theme, teal/navy, or nested gray cards.
- Don't print SwadCost anywhere a person can read it.
- Don't use emoji as icons.
