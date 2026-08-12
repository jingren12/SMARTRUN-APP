# eos Design System

This document describes the visual system that already exists in eos. It is an implementation contract for future UI work, including the planned Chrome PWA install experience. It records current behavior rather than introducing a new visual direction.

## 1. Atmosphere & Identity

eos feels like a focused night-run command center: compact, energetic, and data-rich without becoming noisy. The signature is neon green information emerging from layered indigo-black glass surfaces. The interface is intentionally mobile-first and framed like a personal running device, with small moments of glow, progress, and motion reinforcing momentum.

## 2. Color

### Palette

eos is dark-only. These tokens are defined in `src/index.css` under Tailwind v4 `@theme`.

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

### AuthScreen

- **Structure**: full-viewport sign-in surface rendered inside the 393px mobile shell before any authenticated UI. A centered glass panel contains the eos wordmark, a short Chinese-language prompt, an email/identifier field, a password field, a primary submit button, and an inline error region. No `NavBar` is rendered until authentication succeeds.
- **Variants**: sign-in (default); a toggle to a sign-up mode may be added later but is not part of the initial contract. Loading state on the submit button while a mock request is "in flight".
- **Spacing**: panel padding 20px (`space-5`); field stack gap 12px (`space-3`); submit button top margin 16px (`space-4`); error text 8px (`space-2`) below the button. Panel is vertically centered with at least 24px (`space-6`) of safe-area-aware breathing room top and bottom.
- **States**:
  - Fields: default, focus, disabled (during loading), error (field-level border tint plus helper text).
  - Submit button: default, hover, active press (scale 0.97), focus, loading (disabled with a neon-tinted spinner or label change), error (shake or inline error text, never color-only).
  - Error region: empty when no error; visible error text appears below the form, never as a toast or color-only signal.
- **Accessibility**:
  - Use native `<label>`, `<input type="email">`, `<input type="password">`, and `<button type="submit">`. No custom div-based controls.
  - Each label is programmatically associated with its input via `htmlFor`/`id`.
  - Error text is exposed via `aria-describedby` linking the error element to the affected field, and `aria-invalid="true"` is set on the field when an error is present.
  - Visible focus ring on every field and button using the existing focus treatment; do not rely on color alone.
  - The form is keyboard-navigable in source order: email, password, submit. Enter submits the form.
  - Error messages are written in Chinese, specific, and actionable (for example, "邮箱和密码不能为空" rather than a generic "失败").
  - Respect `prefers-reduced-motion`: disable the error shake and any entry animation.
- **Motion**:
  - Panel entry: a single `slide-up` or opacity fade over 300-400ms with `cubic-bezier(0.16, 1, 0.3, 1)`, communicating content arrival.
  - Button press: transform-only scale 0.97, 100-150ms ease-out.
  - Error feedback: a short horizontal shake (transform-only, under 300ms) or a fade-in of the error text; no decorative motion.
  - No ambient glow loop on this screen; neon is reserved for the focused field border and the primary submit button.
- **Layout**: occupies the full mobile shell; the panel is centered both axes and never exceeds the 393px content width. On desktop the same shell framing (1px side borders, ambient neon frame) applies. No `NavBar`, no tab bar, no bottom navigation is rendered before authentication succeeds.
- **Tokens**: reuse existing tokens only. Panel surface `smartrun-600` with the standard glass treatment; borders `border`/`border-light`; text `text-primary` and `text-secondary`; primary submit button uses `neon` accent with `neon-glow` on focus; error text and error border use `accent-red`. No new color tokens are introduced by this screen.

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

eos uses a **mixed** strategy led by translucent tonal-shift surfaces, with restrained borders and rare ambient glow.

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
| AuthScreen uses `localStorage` for session persistence | `src/App.tsx` (planned) | Frontend-only mock authentication for the prototype; no server, no token refresh, no revocation | Replace with a real auth provider (OAuth/OIDC or backend session) before any production or multi-user deployment. `localStorage` is readable by any script on the origin and must not store real credentials or bearer tokens in production |
| AuthScreen password "hashing" is a mock-only transform | `src/App.tsx` (planned) | Prototype-only obfuscation so the UI can demonstrate the sign-in flow without a backend | Replace with a server-side password hash (Argon2/bcrypt) and never ship mock hashing as if it were security. The mock is explicitly not a security control |
| AuthScreen has no rate limiting, lockout, or CSRF protection | `src/App.tsx` (planned) | No backend exists in the prototype; these controls are server-side by nature | Add server-side rate limiting, lockout, and CSRF protection together with the real auth provider. The frontend cannot enforce these |
| AuthScreen credentials are checked against a mock user list in code | `src/data/mockData.ts` or `src/App.tsx` (planned) | Prototype needs a deterministic demo login to show the post-auth experience | Remove the mock user list and replace with real credential verification when the backend lands. Hardcoded demo credentials must not appear in production builds |
