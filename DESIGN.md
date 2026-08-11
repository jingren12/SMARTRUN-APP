# SmartRun Design System

This document describes the visual system that already exists in SmartRun. It is an implementation contract for future UI work, including the planned Chrome PWA install experience. It records current behavior rather than introducing a new visual direction.

## 1. Atmosphere & Identity

SmartRun feels like a focused night-run command center: compact, energetic, and data-rich without becoming noisy. The signature is neon green information emerging from layered indigo-black glass surfaces. The interface is intentionally mobile-first and framed like a personal running device, with small moments of glow, progress, and motion reinforcing momentum.

## 2. Color

### Palette

SmartRun is dark-only. These tokens are defined in `src/index.css` under Tailwind v4 `@theme`.

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Background | `smartrun-900` | `#0a0a0f` | App and page background |
| Surface | `smartrun-800` | `#0f0f1a` | Base surface and secondary regions |
| Surface/elevated | `smartrun-700` | `#14141f` | Elevated dark areas |
| Surface/card | `smartrun-600` | `#1a1a2e` | Glass card base |
| Surface/hover | `smartrun-500` | `#252540` | Hovered rows and selected areas |
| Border | `border` | `#2a2a40` | Card borders, dividers, desktop frame |
| Border/light | `border-light` | `#3a3a5c` | Stronger separators |
| Text/primary | `text-primary` | `#f0f0f8` | Main text and headings |
| Text/secondary | `text-secondary` | `#a0a0b8` | Supporting text |
| Text/tertiary | `text-tertiary` | `#6b6b8d` | Hints, metadata, disabled-feeling text |
| Text/bright | `smartrun-50` | `#e8e8f0` | High-emphasis secondary text |
| Accent/primary | `neon` | `#00ff88` | Primary actions, active states, progress |
| Accent/dark | `neon-dark` | `#00cc6a` | Darker neon variant |
| Accent/light | `neon-light` | `#66ffb2` | Highlighted neon variant |
| Accent/glow | `neon-glow` | `rgba(0, 255, 136, 0.15)` | Ambient neon treatment |
| Accent/blue | `accent-blue` | `#4a9eff` | Informational and sharing actions |
| Accent/purple | `accent-purple` | `#7c5cff` | AI and secondary feature emphasis |
| Accent/orange | `accent-orange` | `#ff6b35` | Scheduled, warm, or attention states |
| Accent/red | `accent-red` | `#ff3b5c` | Warning or high-intensity states |
| Accent/yellow | `accent-yellow` | `#ffd60a` | Highlight and achievement states |

### Rules

- Use dark surfaces and tonal separation before adding visual effects.
- Neon green is the primary interactive accent and should remain purposeful.
- Blue, purple, orange, red, and yellow communicate feature or status meaning; do not use them as arbitrary decoration.
- New colors must be added to `src/index.css` and this table before use.
- Existing App code contains some one-off Tailwind hex values that match these tokens. Consolidating them is accepted debt, not a reason to create new visual variants during unrelated work.

## 3. Typography

### Scale

The current interface is compact and uses Tailwind utility sizes. The following scale documents the existing hierarchy.

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Display | 32px | 700-800 | 1.2 | Large numeric dashboard values |
| H1 | 24px | 700 | 1.25 | Primary page or greeting emphasis |
| H2 | 17px | 600 | 1.3 | `SectionH` headings |
| H3 | 15-16px | 600 | 1.35 | Card and feature titles |
| Body | 14px | 400-500 | 1.5 | Primary readable content |
| Body/sm | 12-13px | 400-500 | 1.4 | Supporting values and controls |
| Caption | 11px | 400-500 | 1.35 | Metadata, hints, compact labels |
| Numeric | 12-28px | 500-700 | 1.2 | JetBrains Mono metrics and timestamps |

### Font Stack

- Primary: `Inter`, `system-ui`, `-apple-system`, `sans-serif`
- Mono: `JetBrains Mono`, `ui-monospace`, `monospace`
- Maximum font families: two.

### Rules

- Use Inter for labels, navigation, headings, and prose.
- Use JetBrains Mono for pace, distance, time, and other measurement-heavy values.
- Preserve the compact mobile hierarchy, but do not reduce readable body copy below 14px for new screens.
- Chinese and English labels must fit the same hierarchy; allow wrapping rather than clipping long localized text.

## 4. Spacing & Layout

### Base Unit

Spacing follows a 4px base unit, with the current UI most frequently using 4px, 8px, 12px, 16px, 20px, and 24px values.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Icon-to-label and tight gaps |
| `space-2` | 8px | Compact rows, grid gaps, inline groups |
| `space-3` | 12px | Card inner groups and control padding |
| `space-4` | 16px | Standard card and page padding |
| `space-5` | 20px | Comfortable card spacing |
| `space-6` | 24px | Section spacing and larger card padding |
| `space-8` | 32px | Separation between content groups |
| `space-10` | 40px | Major vertical rhythm |

### Grid and Shell

- Primary content shell: `#root` is capped at 393px and centered on wider screens.
- Mobile viewport: full available width, full viewport height, with safe-area-aware viewport configuration in `index.html`.
- Desktop presentation: 1px side borders and a subtle neon ambient frame around the mobile shell.
- Main content: vertical scrolling belongs to the page content container; navigation remains outside that scroll owner.
- Stats: repeated two-column layout through `.stats-grid` with an 8px gap.
- Horizontal lists: use an explicit horizontal overflow owner; do not apply the vertical `.scrollable` class to horizontal-only content.

### Rules

- Prefer the documented spacing steps for visual intent.
- Intrinsic layout mechanics such as `auto`, percentages, and `minmax()` remain raw CSS mechanics.
- Keep primary content readable as one column at 375px; secondary horizontal collections may scroll when clearly signaled.
- Preserve the 393px product frame unless a future responsive requirement explicitly changes it.

## 5. Components

### GlassCard

- **Structure**: rounded container with translucent indigo surface, backdrop blur, and subtle border.
- **Variants**: default; clickable when `onClick` is supplied; optional class extension for content-specific sizing or accent treatment.
- **Spacing**: caller-owned padding, usually 12px-20px; grouped cards use 8px-16px gaps.
- **States**: default; clickable press scales to 0.97; hover and focus must be added explicitly for new interactive card uses; disabled/loading/empty/error are content-owned states.
- **Accessibility**: non-interactive cards remain `div`-like; interactive cards should eventually use a semantic button or link when keyboard activation is required. This semantic limitation is accepted debt for the current `onClick` implementation.
- **Motion**: `whileTap` uses transform-only scale feedback.
- **Layout**: stack or content shell; the card itself does not own scrolling.

### SectionH

- **Structure**: horizontal cluster containing a section heading and optional action button.
- **Variants**: title only; title plus action.
- **Spacing**: 12px bottom margin; heading/action gap uses intrinsic flex spacing.
- **States**: default; action hover, active, and visible focus; no action when omitted.
- **Accessibility**: action is a native button; action labels must be localized and specific. Heading level is `h2`.
- **Motion**: no decorative motion; interaction feedback follows the button system.
- **Layout**: cluster within the page stack.

### Badge

- **Structure**: inline-flex pill with icon/content, tinted border, tinted background, and semantic color.
- **Variants**: default neon plus caller-provided semantic accent color.
- **Spacing**: compact horizontal and vertical padding, approximately 8px/4px.
- **States**: default; semantic color communicates status; interactive badges need explicit button semantics and focus states if introduced.
- **Accessibility**: text must not rely on color alone; icon and label should communicate the same status.
- **Motion**: none by default.
- **Layout**: inline cluster.

### ProgressRing

- **Structure**: SVG background circle, animated progress arc, and centered value/content.
- **Variants**: configurable size, stroke, progress color, background color, and center content.
- **Spacing**: size is content-driven; align within the surrounding card stack.
- **States**: default; zero/partial/complete progress; loading is represented by the caller if needed; error state is not currently defined.
- **Accessibility**: when conveying a meaningful metric, the surrounding content must provide a text equivalent; the SVG is visual support.
- **Motion**: progress arc animates stroke offset over approximately 1.2s with ease-out.
- **Layout**: centered inline-flex primitive; no scroll owner.

### NavBar

- **Structure**: fixed bottom navigation with five tab items and icon/label pairs.
- **Variants**: active and inactive tab; hidden during a run.
- **Spacing**: compact equal-width tab grid within the mobile shell.
- **States**: default, active, press, visible focus; labels and active styling are localized.
- **Accessibility**: use native buttons, clear labels, and a programmatic active indication for future hardening.
- **Motion**: keep tab changes transform/opacity based; avoid layout animation.
- **Layout**: fixed shell layer; page content must reserve room for it.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 100-150ms | ease-out | Press feedback and toggles |
| Standard | 200-300ms | ease-in-out | Tab or panel changes |
| Emphasis | 400-600ms | cubic-bezier(0.16, 1, 0.3, 1) | Meaningful page or content entry |
| Progress | 1000-1200ms | ease-out | Progress ring initialization |
| Ambient | 2000ms loop | ease-in-out | Neon glow pulse only when it communicates active state |

### Rules

- Animate only `transform`, `opacity`, `filter`, and SVG stroke presentation properties where needed.
- Motion must explain an interaction, state change, or content arrival; no decorative micro-motion without meaning.
- Respect `prefers-reduced-motion` by disabling non-essential Framer Motion and CSS animation.
- Interactive controls need hover, active, and visible focus states; mobile press feedback must not be the only state.
- Future install prompts should use motion to establish attention and dismissal, not to repeatedly interrupt the runner.

## 7. Depth & Surface

### Strategy

SmartRun uses a **mixed** strategy led by translucent tonal-shift surfaces, with restrained borders and rare ambient glow.

- Base background: `#0a0a0f`.
- Card surface: `rgba(26, 26, 46, 0.6)` with 20px backdrop blur.
- Card border: approximately `rgba(42, 42, 64, 0.4-0.5)`.
- Elevation comes primarily from surface tone and blur, not heavy shadows.
- Neon glow is reserved for active/important moments and remains low opacity.
- Avoid introducing generic white cards, strong drop shadows, or multiple competing glow colors.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- Target WCAG 2.2 AA for new UI.
- Maintain at least 4.5:1 contrast for normal text and 3:1 for large text or graphical focus indicators.
- Every interactive element must be keyboard reachable with a visible focus state.
- Never communicate status by color alone; pair color with text, icon, shape, or position.
- Respect `prefers-reduced-motion`.
- Preserve readable content and localization reflow at 375px; English labels may be longer than Chinese labels.
- Use native semantic buttons and links for new actions. Avoid emoji as interface icons; use the existing SVG icon approach.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|------|----------|--------------|--------------|
| Some repeated raw hex utility values | `src/App.tsx` | Existing UI predates this document and values map to current tokens | Consolidate during a dedicated styling cleanup |
| `GlassCard` click behavior is on a `motion.div` | `src/App.tsx` | Existing interaction is visual and currently mock-only | Replace with semantic button/link wrapper when real navigation/actions ship |
| `body` disables scrolling and selection globally | `src/index.css` | Current app is a controlled mobile shell prototype | Revisit when text selection, desktop layouts, or PWA browser behavior requires it |
| Font loading depends on Google Fonts | `index.html` | Existing visual identity uses Inter and JetBrains Mono | Add a self-hosted/offline strategy when PWA offline requirements are implemented |
| Reduced-motion overrides are not yet centralized | `src/index.css`, `src/App.tsx` | Existing motion predates the design-system extraction | Add a shared reduced-motion policy before expanding animated surfaces |
