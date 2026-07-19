# SmartRun App

Mobile-first running companion with AI coach, robot control, and training analytics.

## Features

- **Training Dashboard** — Today's plan, recovery index, fatigue level, weekly streak
- **GPS Run Tracking** — Real-time metrics (pace, heart rate, cadence), route preview, AI live coaching
- **AI Coach** — Personalized training advice, form analysis, heart rate zone distribution, Q&A
- **Robot Companion** — SmartRun X1 robot control: follow mode, supply mode, auto-record, remote control
- **Team (团队)** — Share stats with friends, schedule group runs together
- **🌐 i18n** — Chinese / English language toggle with full UI translation

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 (CSS-based `@theme`) |
| Animation | Framer Motion 12 |
| Charts | Recharts 3 |
| Lint | oxlint |
| Deploy | Vercel (auto-deploy on push to main) |

## Getting Started

```bash
npm install
npm run dev        # Start dev server on :5173
npm run build      # Type-check + production build
npm run lint       # Run oxlint
npm run preview    # Preview production build
```

## Project Structure

```
src/
├── App.tsx              # All UI components (single-file SPA)
├── main.tsx             # Entry point
├── index.css            # Tailwind v4 + custom design tokens
├── i18n/
│   ├── translations.ts  # Type-safe zh/en translation maps
│   └── context.tsx       # React context + useT/useLang hooks
└── data/
    ├── types.ts          # Canonical type definitions
    └── mockData.ts       # Mock data (not used at runtime)
```

## License

Private
