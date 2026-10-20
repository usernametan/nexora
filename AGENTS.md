# AGENTS.md

## Stack

React 18 + Vite 6 single-page prototype ("Personal Cosmos"). No backend, router, TypeScript, or state library. 3D UI uses `@react-three/fiber` + `three`/`drei`; transitions use GSAP; styling is mostly hand-written CSS in `src/App.css` with Tailwind available. `README.md` is the stock Vite template, not project documentation.

**Backend constraint (mandatory):** any backend/API added to this project must be written in Java only. The repository currently has no backend; all data is mock data in `src/data/mockData.js`.

## Setup

```bash
npm install
npm run dev
```

No `.env`, database, or other services are required. For first-time E2E setup, install Playwright browsers with `npx playwright install`.

## Commands

```bash
npm install          # node_modules is not committed
npm run dev          # Vite dev server
npm run build
npm run lint         # ESLint 9 flat config, covers all js/jsx incl. tests
npm run test:e2e     # Playwright; auto-starts/reuses dev server on 127.0.0.1:5173
npx playwright test -g "desktop cosmos and dashboard flows"   # single test
npm run preview
```

There is no typecheck or unit-test script. Playwright tests run serially (`workers: 1`, not fully parallel). Screenshots are written to `/tmp/opencode/`.

## Architecture

- `src/App.jsx` is the whole app state machine: `activePlanet` (open dashboard), `lockedPlanet` (modal), `hoveredPlanet`, `isClosing`. No URL routing.
- Planet definitions are the source of truth in `src/data/mockData.js`; `activePlanets`/`lockedPlanets` are derived from `locked`. All dashboard data is mock data there too.
- Adding a planet requires: entry in `mockData.js`, dashboard mapping in `src/components/dashboards/PlanetDashboard.jsx`, and (for mobile) `mobilePlanetIds` in `CosmosScene.jsx`. The sidebar and 3D scene iterate the data automatically.
- Dashboards are keyed by planet id and unmounted on exit. Interactive state is persisted to `localStorage` under the `personal-cosmos:*` namespace via `src/hooks/useLocalStorage.js` (Earth tasks, Mercury notes/errands, Jupiter expenses, Neptune bookmarks, Saturn timer/sessions/ambient, Moon hydration), so it survives navigation and reloads.
- Saturn ambient sound is synthesized in the browser with the Web Audio API in `src/hooks/useAmbientAudio.js`; there are no audio assets.
- Planet textures/clouds are generated procedurally at runtime in `src/utils/planetTextures.js` (canvas; cached by texture name). There are no texture image assets to edit.
- Tailwind content globs are only `index.html` and `src/**/*.{js,jsx}`; custom tokens `cosmos`, `glass`, `boxShadow.glass`, and the Manrope font are in `tailwind.config.js`. Component theming mostly uses CSS variables/classes in `App.css`.
- `PlanetDashboard` uses GSAP enter/exit; on exit it calls `onExited` to clear `activePlanet`. Don't clear the planet state directly or the exit animation breaks.

## Testing gotchas

- `tests/cosmos.spec.js` asserts exact UI copy (e.g. `Good morning, Tan`), exactly 7 `.planet-nav__item` elements, and zero console/page errors. Update tests when copy or planet count changes.
- The CRUD flow test uses accessible labels (`Task title`, `Expense amount`, `Bookmark URL`, etc.) and row action labels (`Edit …`, `Delete …`); keep those labels stable or update the test with the UI.
- Tests rely on animation timing (`waitForTimeout`) and select planets via label/canvas coordinates; they are sensitive to reduced-motion or animation changes.
- Tests cover 1440x900 desktop and 390x844 mobile (including no horizontal overflow); all 7 sidebar items are present on mobile and all 7 planets render in the mobile 3D scene.
- Escape closes the locked-planet modal first, then the active dashboard.
