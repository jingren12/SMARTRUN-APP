# AGENTS.md — SmartRun App

## Architecture

- Single-page React app (SPA) — mobile-first running companion with AI coach, robot control, and training analytics.
- **All UI code lives in `src/App.tsx` (949 lines).** `src/components/` and `src/pages/` are empty scaffolding. Do not split into files unless explicitly asked.
- Shared types live in `src/data/types.ts`, mock data in `src/data/mockData.ts`. The types in `src/data/types.ts` are the canonical definitions.

## Commands

```bash
npm run dev        # Vite dev server on port 5173
npm run build      # tsc -b && vite build  (type-check FIRST, then bundle)
npm run lint       # oxlint (not eslint)
npm run preview    # Vite preview of production build
```

## Stack & Config Quirks

| Concern | Reality |
|---|---|
| Tailwind | **v4** — `@import "tailwindcss"` + `@theme {}` in `src/index.css`. No `tailwind.config.js`. |
| Linter | **oxlint** (`.oxlintrc.json`), not eslint. Only `react` and `typescript` plugins active. |
| TypeScript | **v6** with project references (`tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`). `erasableSyntaxOnly` and `verbatimModuleSyntax` are enabled. |
| Build | `tsc -b` type-checks both app and node configs; `vite build` bundles. Type errors block the build. |
| Fonts | Inter (sans) + JetBrains Mono (mono), loaded from Google Fonts in `index.html`. |

## Design System

- **Mobile-first**: `#root` is capped at `max-width: 393px`, centered with side borders on desktop.
- **Dark theme** only — background `#0a0a0f`, glass panels with `backdrop-filter: blur(20px)`.
- Custom CSS classes: `.glass` (frosted panel), `.scrollable` (smooth touch scroll, hidden scrollbar), `.stats-grid` (2-col stat layout), `.pulse-glow`, `.slide-up`.
- Color tokens defined in `@theme {}` in `src/index.css`: `neon` (#00ff88 is primary accent), `accent-blue`, `accent-purple`, `accent-orange`, `accent-red`, `smartrun-*` grays.
- **UI is in Chinese.** All labels, button text, and data values are Chinese.

## What Not To Do

- Do NOT add eslint config. The project uses oxlint.
- Do NOT create a tailwind.config file. It's Tailwind v4 with CSS-based config.
- Do NOT refactor App.tsx to split content into files under `src/components/` or `src/pages/` unless the user explicitly requests it.
- Do NOT add `as any`, `@ts-ignore`, or `@ts-expect-error` — the tsconfig has strict unused locals/params checks.
- Do NOT add a backend or real API integrations unless asked — all data is mock/stub.

## Testing

- No unit tests or CI. The only test tooling is `test-screenshots.mjs` — a Playwright script that captures screenshots of each tab. Requires `npx playwright install chromium` and the dev server running on `:5173`.
- Run: `node test-screenshots.mjs` (output to `screenshots/`).
