# FIT File Tools

A browser-based tool for inspecting, analyzing, and comparing Garmin/ANT+ FIT activity files. Built with React, TypeScript, and Vite. All processing happens client-side — no data leaves your browser.

## Features

- **Upload** — Drag-and-drop or browse for `.fit` files. Parsed files are persisted in IndexedDB across sessions.
- **Inspect** — View session summary, laps, device info, activity metrics, and zones target data. Interactive charts (heart rate, power, cadence, speed, altitude) with range brushing and selection stats. GPS route displayed on a MapLibre map with metric-based color coding.
- **Compare** — Side-by-side comparison of two activity files with manual or GPS-based time synchronization and aligned metric charts.
- **Extra Data** — Browse all non-standard FIT message types and fields as searchable/sortable tables.

## Tech Stack

- **React 19** with TypeScript
- **Vite 8** for dev server and bundling
- **Tailwind CSS 4** for styling
- **Zustand** for state management (persisted to IndexedDB)
- **Recharts** for charts
- **MapLibre GL** for maps
- **fit-file-parser** for FIT binary decoding (with runtime patches for extended message support)
- **Vitest** + **Testing Library** for tests

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests in watch mode |
| `npm run test:coverage` | Run tests once with coverage report |

## Project Structure

```
src/
├── components/
│   ├── compare/       # File comparison views
│   ├── datafields/    # Extra FIT data browser
│   ├── inspect/       # Activity inspection views, charts, map
│   ├── layout/        # Header, sidebar
│   └── upload/        # File drop zone
├── lib/
│   ├── colorScales.ts    # GeoJSON route coloring
│   ├── constants.ts      # Metric definitions
│   ├── fitParser.ts      # FIT file parsing and normalization
│   ├── formatters.ts     # Display formatting utilities
│   ├── geoUtils.ts       # Haversine distance, record lookups, bounds
│   └── syncAlgorithm.ts  # Manual/GPS sync and record alignment
├── stores/
│   ├── comparisonStore.ts  # Comparison state
│   ├── fileStore.ts        # Parsed file storage (IndexedDB-backed)
│   └── uiStore.ts          # UI state (view, selection, hover)
├── types/               # TypeScript interfaces
└── test/                # Test setup
```

## Testing

Tests are written with Vitest and cover utility functions, stores, and components:

```bash
npm test              # watch mode
npm run test:coverage # single run with coverage
```

## License

Private project.
