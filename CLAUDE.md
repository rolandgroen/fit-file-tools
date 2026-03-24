# CLAUDE.md

## Project Overview

FIT File Tools is a client-side React/TypeScript SPA for parsing and analyzing Garmin FIT activity files. All processing happens in the browser with data persisted in IndexedDB.

## Build & Run

```bash
npm install          # install deps (runs patch-package via postinstall)
npm run dev          # start Vite dev server on port 5173
npm run build        # tsc type-check + vite build → dist/
npm run lint         # eslint
npm test             # vitest in watch mode
npm run test:coverage  # vitest single run with coverage
```

## Architecture

- **Vite config** includes a custom plugin (`fitParserPatch`) that patches `fit-file-parser` at transform time to add device_battery_status (message 104) and fix the default handler to collect arrays. There is also a static `patches/` dir used by `patch-package` at install time.
- **State management** uses Zustand with persist middleware backed by IndexedDB (`idb-keyval`). The `fileStore` handles parsed files, `uiStore` handles UI state, `comparisonStore` handles compare mode.
- **Parsing** is in `src/lib/fitParser.ts`. Internal helpers (`num`, `str`, `toDate`, `kmToM`, `toPrimitive`, `normalizeRecord`, etc.) are exported with `@internal` jsdoc for testing.
- **All lib functions are pure** — no side effects, easy to test.

## Key Conventions

- TypeScript strict mode, `verbatimModuleSyntax`, `erasableSyntaxOnly`
- Tailwind CSS 4 (utility-first, supports dark mode via `dark:` prefix)
- Components use named exports (no default exports except `App`)
- Types live in `src/types/` — `fit.ts` for FIT data types, `comparison.ts` for compare mode, `app.ts` for UI types
- Tests use Vitest with jsdom environment. Test files go in `__tests__/` directories adjacent to the code they test.
- No backend — everything runs client-side

## Testing

- Test setup: `src/test/setup.ts` imports `@testing-library/jest-dom`
- Config: `vitest.config.ts` extends `vite.config.ts`
- Globals enabled (`describe`, `it`, `expect` available without imports)
- Component tests use `@testing-library/react`
- The `fileStore` tests mock `idb-keyval` since IndexedDB is not available in the test environment
- `fileStore.ts` has a defensive guard in `migrateFromLocalStorage()` for non-browser environments

## File Naming

- Components: PascalCase (e.g., `InspectView.tsx`, `StatCard.tsx`)
- Lib/utils: camelCase (e.g., `fitParser.ts`, `geoUtils.ts`)
- Tests: `*.test.ts` / `*.test.tsx` in `__tests__/` directories
- Types: camelCase in `src/types/`
