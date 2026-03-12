# Design System Foundation

## Core decisions
- 4px spacing scale is the only spacing source. Components use tokenized spacing, not one-off pixel values.
- Color usage is semantic (`--color-*`), not direct grayscale references in components.
- Shared layout shells (`.main-content`, `.page-content`) follow the same page padding contract.
- Interaction states are centralized around shared transition and focus tokens.
- Mobile touch targets use a minimum control size token (`--size-touch-target`).

## Token groups
Defined in `/Users/efbakir/efbakir-personalwebsite/design-system.css`.

- Color tokens
  - `--color-bg`, `--color-surface`, `--color-surface-muted`
  - `--color-text-primary`, `--color-text-secondary`
  - `--color-border`, `--color-overlay`, `--color-overlay-strong`
  - `--accent`
- Spacing tokens
  - `--spacing-0` through `--spacing-24` (4px base rhythm)
- Layout tokens
  - `--grid-container-width`, `--grid-margin`, `--grid-gutter`
  - `--page-padding-top`, `--page-padding-bottom`
  - `--section-gap`, `--section-gap-large`
- Interaction tokens
  - `--duration-fast`, `--duration-base`, `--easing-standard`
  - `--transition-color`, `--transition-opacity`, `--transition-transform`
  - `--focus-ring-width`, `--focus-ring-color`, `--focus-ring-offset`
  - `--size-touch-target`

## Layout contracts
- `.main-content` and `.page-content` always use tokenized page padding.
- Section spacing uses `--section-gap` or `--section-gap-large` only.
- Project and writing list rows share consistent border and vertical rhythm behavior.

## Interaction contracts
- Focus ring styling is standardized for all actionable controls.
- Hover and active transitions use shared motion tokens.
- Reduced-motion support is global.
- Glossary expansion uses content-safe animation (no fixed max-height clipping).

## Script architecture
- Shared behavior is centralized in `/Users/efbakir/efbakir-personalwebsite/site.js`:
  - theme toggle
  - CV modal
  - project filters + hover preview
  - glossary accordion
- Mobile nav remains in `/Users/efbakir/efbakir-personalwebsite/nav.js` and coordinates body scroll lock with shared logic.
