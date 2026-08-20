# Repository guidance

## Purpose

This is a local-first, static GitHub Pages viewer for EPA SWMM INP files. It is
a visualization tool, not a hydraulic solver and not an engineering verifier.

## Architecture

- `src/inp/`: pure INP parsing; no DOM or Three.js imports.
- `src/domain/`: shared model types.
- `src/viewer/`: Three.js rendering and picking.
- `src/main.ts`: UI composition and application orchestration.
- `public/examples/`: small public example models.

## Commands

- `npm run dev`: local development.
- `npm run typecheck`: strict TypeScript checks.
- `npm test`: parser tests.
- `npm run build`: production GitHub Pages build.

## Invariants

- A user-selected INP file must remain inside the browser.
- Never send model data to a server or third-party API.
- Never render INP strings through `innerHTML`.
- Preserve original IDs and numeric values in the parsed model.
- Treat 3D geometry as visualization only; do not imply 3D hydraulic results.
- Add parser tests when supporting a new INP section.

## Definition of done

Type checking, tests, and the production build pass. Keyboard access and the
object table continue to provide a non-canvas path to model information.
