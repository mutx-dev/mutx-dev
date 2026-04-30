---
version: alpha
name: MUTX Signal Forge
description: "A full redesign system for an AI-agent control plane: dark, precise, high-contrast, and built around live operational signal."
colors:
  primary: "#A4FF5C"
  on-primary: "#051103"
  primary-container: "#18380D"
  on-primary-container: "#EBFFBF"
  secondary: "#73EFBE"
  on-secondary: "#03110B"
  secondary-container: "#103A28"
  on-secondary-container: "#D7FFE9"
  tertiary: "#C3FF5B"
  on-tertiary: "#04140A"
  tertiary-container: "#263A0B"
  on-tertiary-container: "#F2FFD2"
  background: "#030804"
  on-background: "#F5FFE9"
  surface: "#071108"
  surface-dim: "#020603"
  surface-bright: "#122018"
  surface-container-lowest: "#040905"
  surface-container-low: "#081209"
  surface-container: "#0D180F"
  surface-container-high: "#142416"
  surface-container-highest: "#203422"
  on-surface: "#F5FFE9"
  on-surface-variant: "#DDEFD3"
  on-surface-muted: "#9DBC91"
  outline: "#344A31"
  outline-variant: "#1C2D1B"
  surface-tint: "#A4FF5C"
  inverse-surface: "#F5FFE9"
  inverse-on-surface: "#030804"
  error: "#FF6B7A"
  on-error: "#26060B"
  error-container: "#3B1118"
  on-error-container: "#FFD8DD"
  warning: "#FFC857"
  on-warning: "#1B1202"
  success: "#58F0A4"
  on-success: "#03130A"
  info: "#8EB5FF"
  on-info: "#061126"
  focus: "#EBFFBF"
typography:
  display-hero:
    fontFamily: "Suisse Neue"
    fontSize: 96px
    fontWeight: 700
    lineHeight: 0.88
    letterSpacing: "-0.075em"
  display-lg:
    fontFamily: "Suisse Neue"
    fontSize: 72px
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.07em"
  display-md:
    fontFamily: "Suisse Neue"
    fontSize: 56px
    fontWeight: 700
    lineHeight: 0.96
    letterSpacing: "-0.06em"
  headline-lg:
    fontFamily: "Syndicat Grotesk"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.045em"
  headline-md:
    fontFamily: "Syndicat Grotesk"
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  headline-sm:
    fontFamily: "Syndicat Grotesk"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.16
    letterSpacing: "-0.025em"
  title-lg:
    fontFamily: "Syndicat Grotesk"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title-md:
    fontFamily: "Syndicat Grotesk"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.32
    letterSpacing: "-0.01em"
  body-lg:
    fontFamily: "Syndicat Grotesk"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.62
  body-md:
    fontFamily: "Syndicat Grotesk"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.65
  body-sm:
    fontFamily: "Syndicat Grotesk"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
  label-lg:
    fontFamily: "IBM Plex Mono"
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.18em"
  label-md:
    fontFamily: "IBM Plex Mono"
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.22em"
  label-sm:
    fontFamily: "IBM Plex Mono"
    fontSize: 10px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.18em"
  code-md:
    fontFamily: "IBM Plex Mono"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.8
rounded:
  none: 0px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 22px
  "2xl": 28px
  "3xl": 36px
  full: 9999px
spacing:
  none: 0px
  micro: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  "2xl": 48px
  "3xl": 64px
  "4xl": 96px
  shell-padding-mobile: 16px
  shell-padding-tablet: 24px
  shell-padding-desktop: 32px
  panel-padding: 24px
  section-y: 96px
layout:
  public-shell-max: 1360px
  marketing-shell-max: 1760px
  app-shell-max: 1600px
  app-sidebar-width: 288px
  app-topbar-height: 56px
  content-narrow: 720px
  content-readable: 880px
  grid-size-public: 56px
  grid-size-app: 48px
  hero-min-height: 760px
borders:
  hairline:
    width: 1px
    color: "{colors.outline-variant}"
  standard:
    width: 1px
    color: "{colors.outline}"
  active:
    width: 1px
    color: "{colors.primary}"
  focus:
    width: 2px
    color: "{colors.focus}"
shadows:
  none: "none"
  surface-soft: "0 18px 44px #00000045"
  surface-strong: "0 34px 100px #00000073"
  shell: "0 40px 140px #0000008A"
  primary-glow: "0 20px 64px #A4FF5C33"
  secondary-glow: "0 18px 54px #73EFBE2E"
  tertiary-glow: "0 18px 54px #C3FF5B2E"
  danger-glow: "0 18px 54px #FF6B7A30"
  focus-ring: "0 0 0 3px #EBFFBF66"
elevation:
  level-0:
    backgroundColor: "{colors.background}"
    shadow: "{shadows.none}"
  level-1:
    backgroundColor: "{colors.surface-container-low}"
    shadow: "{shadows.surface-soft}"
  level-2:
    backgroundColor: "{colors.surface-container}"
    shadow: "{shadows.surface-strong}"
  level-3:
    backgroundColor: "{colors.surface-container-high}"
    shadow: "{shadows.shell}"
  level-accent:
    backgroundColor: "{colors.primary-container}"
    shadow: "{shadows.primary-glow}"
motion:
  duration-instant: "80ms"
  duration-fast: "140ms"
  duration-standard: "200ms"
  duration-emphasis: "360ms"
  duration-reveal: "620ms"
  duration-ambient: "18000ms"
  easing-standard: "ease"
  easing-emphasized: "cubic-bezier(0.22, 1, 0.36, 1)"
  easing-exit: "cubic-bezier(0.4, 0, 1, 1)"
blur:
  none: 0px
  sm: 6px
  md: 12px
  lg: 18px
  xl: 24px
gradients:
  page: "radial-gradient(circle at 14% 0%, #A4FF5C24, transparent 24rem), radial-gradient(circle at 86% 10%, #73EFBE18, transparent 28rem), linear-gradient(180deg, #071108 0%, #030804 56%, #020603 100%)"
  app-shell: "linear-gradient(180deg, #0D180F 0%, #030804 100%)"
  panel: "linear-gradient(180deg, #0D180FF7 0%, #071108FA 100%)"
  panel-strong: "radial-gradient(circle at top right, #A4FF5C24, transparent 28%), linear-gradient(180deg, #142416FA 0%, #071108FA 100%)"
  primary-action: "linear-gradient(135deg, #EBFFBF 0%, #A4FF5C 44%, #60CA32 100%)"
  secondary-action: "linear-gradient(135deg, #D7FFE9 0%, #73EFBE 48%, #2DBD7D 100%)"
  tertiary-action: "linear-gradient(135deg, #F2FFD2 0%, #C3FF5B 46%, #7FD530 100%)"
opacity:
  disabled: 0.5
  text-secondary: 0.82
  text-muted: 0.64
  border-subtle: 0.14
  border-strong: 0.32
  grid-faint: 0.06
components:
  app-canvas:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    typography: "{typography.body-md}"
  page-floor:
    backgroundColor: "{colors.surface-dim}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.body-sm}"
  surface-base:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  surface-bright:
    backgroundColor: "{colors.surface-bright}"
    textColor: "{colors.on-surface-variant}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  surface-lowest:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface-muted}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  surface-low:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface-variant}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  surface-standard:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  surface-high:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.xl}"
  surface-highest:
    backgroundColor: "{colors.surface-container-highest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.3xl}"
    padding: "{spacing.xl}"
  hero-title:
    textColor: "{colors.on-background}"
    typography: "{typography.display-hero}"
  section-title:
    textColor: "{colors.on-surface}"
    typography: "{typography.display-md}"
  body-copy:
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.body-md}"
  muted-copy:
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.body-sm}"
  mono-label:
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
  primary-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    height: 48px
    padding: "0 24px"
  primary-button-hover:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
  secondary-button:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    height: 48px
    padding: "0 24px"
  secondary-chip:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "5px 12px"
  tertiary-button:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    height: 48px
    padding: "0 24px"
  tertiary-chip:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-tertiary-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "5px 12px"
  inverse-toast:
    backgroundColor: "{colors.inverse-surface}"
    textColor: "{colors.inverse-on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  input-field:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    height: 48px
    padding: "0 16px"
  app-sidebar-item:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    height: 44px
    padding: "0 14px"
  app-sidebar-item-active:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    height: 44px
    padding: "0 14px"
  stat-card:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.lg}"
  code-block:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.code-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  divider:
    backgroundColor: "{colors.outline-variant}"
    height: 1px
  border-swatch:
    backgroundColor: "{colors.outline}"
    height: 1px
  tint-swatch:
    backgroundColor: "{colors.surface-tint}"
    size: 8px
    rounded: "{rounded.full}"
  error-button:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-error}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    height: 44px
    padding: "0 20px"
  error-banner:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-error-container}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  warning-badge:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.on-warning}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "5px 12px"
  success-badge:
    backgroundColor: "{colors.success}"
    textColor: "{colors.on-success}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "5px 12px"
  info-badge:
    backgroundColor: "{colors.info}"
    textColor: "{colors.on-info}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "5px 12px"
  focus-marker:
    backgroundColor: "{colors.focus}"
    textColor: "{colors.on-success}"
    rounded: "{rounded.full}"
    size: 10px
---

## Overview

MUTX Signal Forge is a full visual redesign for an AI-agent control plane. It keeps the product dark and operational, but replaces the current split personality with a single high-contrast system: obsidian surfaces, luminous cyan command paths, brass decision moments, and green proof-of-work states.

The interface should feel like a live operations room built for people who need to trust what their agents are doing. It is not playful and it is not decorative. It should feel precise, inspectable, and fast, with enough atmosphere to be memorable.

## Colors

The core palette is obsidian, porcelain, cyan, brass, and proof green. Cyan is the primary interaction and navigation signal. Brass is reserved for decisions, upgrades, downloads, or moments where the user is choosing a path. Green indicates verified success, local readiness, or proof states. Error, warning, and info colors are intentionally saturated so they read clearly against deep surfaces.

Use near-black backgrounds instead of pure black. Every surface should sit on a tonal ladder: canvas, floor, base, low container, standard container, high container, highest container. Borders should be visible but quiet; highlights should come from radial light, focus rings, and active fills rather than large blocks of saturated color.

## Typography

Use Suisse Neue for large display moments and Syndicat Grotesk for product UI and body copy. Headlines are tight, confident, and compact. Body copy is calmer, with generous line height for dense operational content.

IBM Plex Mono is the system voice for route IDs, status labels, commands, timestamps, and telemetry. Mono text should usually be uppercase, tracked out, and small. Do not use mono for long paragraphs.

## Layout

The redesign is shell-first. Public pages and app pages should share a strong frame: top rails, operator labels, status strips, and panels arranged on an 8px rhythm. Marketing pages can use full-viewport composition, but product pages should prioritize scan speed and direct action.

Use wide shells for operational surfaces, narrow readable columns for prose, and fixed side navigation for app flows. Panels should align to a visible grid but avoid looking like generic card decks. Important controls should sit near live system state.

## Elevation & Depth

Depth comes from tonal stacking, precise borders, and ambient glow. Level 0 is the canvas. Level 1 is a low panel. Level 2 is a primary working panel. Level 3 is shell chrome, modal chrome, or a strongly elevated route header.

Shadows must be soft and deep, never gray and dirty. Accent glows are allowed only when attached to real state: primary actions, active routes, verified success, errors, or focus.

## Shapes

Radii are rounded but engineered. Navigation rows and controls use 12 to 16px radii. Major panels use 22 to 36px. Buttons and chips are full pills. Code blocks and terminal regions use smaller radii so they feel more precise than marketing panels.

Do not mix sharp and rounded geometry within the same component group. The only intentionally sharp elements are dividers, grid lines, and measurement marks.

## Components

Primary buttons are cyan with dark text. Secondary decision actions are brass. Success and proof actions are green. Destructive actions use saturated rose with dark text for clear contrast. Ghost controls should sit on low surfaces with quiet borders and brighten only on hover.

Cards are working panels, not decorations. A good card has one clear label, one strong value or action, and one supporting line. Route headers are large, rounded, and status-rich. Badges are compact, mono, uppercase, and full-pill.

Inputs use dark inset surfaces with porcelain text. Focus uses the mint focus ring. Tables should use dividers and muted labels rather than heavy borders.

## Do's and Don'ts

- Do keep the UI dark, crisp, and operational.
- Do make cyan the primary command path.
- Do use brass only for decision moments and business-critical calls to action.
- Do use green only for proof, readiness, success, and verified completion.
- Do keep labels short, mono, uppercase, and tracked.
- Do make data panels dense but not cramped.
- Don't use generic slate cards without visible hierarchy.
- Don't use large decorative gradients that are detached from state.
- Don't put marketing composition into app routes.
- Don't use low-contrast blue text on blue surfaces.
