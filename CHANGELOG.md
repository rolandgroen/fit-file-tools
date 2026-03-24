# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.3.0] - 2026-03-24

### Added
- Comprehensive test suite with Vitest, Testing Library, and jsdom
  - 132 tests across 9 test files covering lib utilities, Zustand stores, and React components
  - Test scripts: `npm test` (watch) and `npm run test:coverage`
- Exported internal helpers from `fitParser.ts` for unit testing
- Defensive guard in `migrateFromLocalStorage()` for non-browser environments
- Project documentation: README.md, CLAUDE.md, CHANGELOG.md

## [0.2.0] - 2026-03-23

### Added
- Extra Data dashboard for browsing non-standard FIT message types
- Activity metrics panel (VO2 max, training effect, recovery time, etc.)
- Zones target display (FTP, max HR, threshold HR)
- File ID information panel
- Device battery status support (FIT message 104) via Vite transform plugin
- Selection stats with range brushing on charts
- Metric-colored GPS route on map

### Changed
- Redesigned Data Fields view into searchable/sortable Extra Data dashboard
- Enriched Inspect view with additional panels

## [0.1.0] - 2026-03-23

### Added
- Initial project scaffold with Vite, React 19, TypeScript
- FIT file parsing with `fit-file-parser` (patched for extended message support)
- Drag-and-drop file upload
- Session summary, lap, and device info views
- Interactive charts for heart rate, power, cadence, speed, altitude
- GPS route map with MapLibre GL
- File comparison with manual and GPS-based time synchronization
- IndexedDB-backed file persistence via Zustand + idb-keyval
- Dark mode support via Tailwind CSS
