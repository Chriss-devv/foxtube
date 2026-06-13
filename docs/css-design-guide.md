---
name: foxtube-css-design
description: Use when editing FoxTube/Invidious CSS, especially /srv/docker/arr/invidious/default.dracula.css, feed cards, navigation, Shorts, watch pages, mobile layout, or visual polish.
---

# FoxTube CSS Design

Use this skill for FoxTube visual work on the Invidious overlay.

## Goals

- Preserve the existing FoxTube dark identity while making it cleaner, denser, and closer to modern YouTube ergonomics.
- Keep desktop and mobile usable without horizontal overflow.
- Prefer small additive CSS blocks over risky rewrites of upstream Invidious CSS.
- Avoid generic AI-looking gradients and oversized cards.

## Rules

- Scope new visual rules to FoxTube classes such as `.ft-pro-*`, `.ft-nav-*`, `.ft-chris-*`, `.ft-short-*`, or body state classes.
- Prefer CSS variables for colors, radii, surfaces, shadows, and spacing.
- Use responsive grids with `repeat(auto-fill, minmax(...))` on desktop and single-column cards on narrow mobile.
- Keep thumbnails at 16:9 for normal feeds and vertical viewport layout for Shorts.
- Avoid adding more duplicate `.feed-menu` rules unless the later block intentionally overrides all previous behavior.
- Do not remove old CSS unless the specific selector conflict is verified.

## Visual Direction

- Background: deep neutral navy/black, not pure black everywhere.
- Cards: minimal border, subtle hover, compact metadata, strong title readability.
- Navigation: horizontal pill rail, sticky on mobile, clear active/hover states.
- Buttons: pill shape, clear contrast, modest shadow.
- Shorts: full-screen vertical rail, centered video, readable bottom overlay.

## Validation

- Check `/feed/popular?ft_feed=1`, `/feed/popular`, `/shorts`, `/feed/subscriptions`, `/feed/history`, `/feed/playlists`, and `/watch?v=...`.
- Verify mobile widths around 390px, 430px, 760px, and desktop widths above 1280px.
- Watch for horizontal scroll, clipped nav, unreadable metadata, and player control overlap.
