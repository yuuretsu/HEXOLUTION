# Monorepo: extract simulation package

Date: 2026-09-12  
Branch: `feat/monorepo-simulation`

## Goal

Turn the repo into an npm workspaces monorepo and extract the simulation into `@hexolution/simulation`, while keeping root DX unchanged (`npm run dev` / `test` / `build` / `lint`).

## Non-goals

- Refactor or remove the `World` class (thin wrapper stays as-is for now)
- Extract `src/worker/` into a package
- Switch to pnpm or add Turborepo
- Publish packages to npm

## Decisions

| Topic | Choice |
| --- | --- |
| Tooling | npm workspaces, no turbo |
| App location | Stay at repo root (`src/`, Vite, Electron) |
| Packages | `packages/shared`, `packages/simulation` |
| Dev linking | Source exports; Vite resolves workspace packages without a separate sim build |
| Root scripts | Unchanged entry points; orchestrate workspace as needed under the hood |
| Lint / TS | One shared ESLint + shared TypeScript baseline for app and packages |

## Layout

```
/
  package.json                 # workspaces: ["packages/*"], existing scripts
  eslint.config.js             # single flat config covering app + packages/*
  tsconfig.base.json           # shared compilerOptions (strict, module, etc.)
  tsconfig.json                # project references: app + packages
  packages/
    shared/                    # @hexolution/shared
      package.json
      src/
      tsconfig.json            # extends base
    simulation/                # @hexolution/simulation
      package.json
      src/                     # former src/simulation + sim constants
      tsconfig.json            # extends base
  src/                         # app (simulation/ removed)
  ...
```

Dependency direction:

```
app  →  @hexolution/simulation  →  @hexolution/shared
app  →  @hexolution/shared      (only if app needs shared types/utils directly)
```

Simulation must not import from the app (`@/…`).

## Package contents

### `@hexolution/shared`

Moved from app `src/shared` (simulation-facing pieces only):

- Type: `Rgba`
- Utils: `choice`, `lerp`, `lerpRgb`, `base4toInt` (internal; see public gene API below), `clampCycle`, `createRandom`, `hslaToRgba`, `mutateColorInto`, `randomLightColorInto`, plus related helpers that these depend on
- `ObjectPool`, `Counter`
- Grid: `GridMap`, `IGrid`, `GridMatrix` (and grid module files)

Not moved (stay in app `@/shared`):

- `worker-api`, hooks, UI, render, hex-math
- App/runtime constants: `WORLD_*`, `INITIAL_SIMULATION_SPEED`, spawn counts, etc.
- `ViewMode`
- UI-only helpers that leave shared utils (e.g. `chunk` — replaced on the frontend)

### `@hexolution/simulation`

- Entire former `src/simulation/` tree (world, creature, organic, stone, tape, dichotomy, api, …)
- Simulation constants formerly in app constants that the sim owns:
  - `ENERGY_PER_CELL`, `MAX_CELL_ENERGY`
  - `GENOME_LENGTH`, `GENES_PER_TICK`
  - `GENOME_MUTATION_RATE`, `COLORATION_MUTATION_RATE`
  - `AGE_ENERGY_COST_FACTOR`
- Public exports at minimum:
  - domain: world/items, creature, organic, stone, tape, …
  - `api/*`: types, grid-layout, grid-publisher, gene-meta
  - `MAX_CELL_ENERGY`
  - `geneIdFromBases(a, b, c)` — domain name for the base4→gene-id encoding used by Tape/creature and the program UI

## App UI vs library (overlap)

| Symbol | UI use | Decision |
| --- | --- | --- |
| `lerpRgb` | `grid-colorizer` energy/organic blends | **Local in app**, keep name `lerpRgb` next to the palette |
| `MAX_CELL_ENERGY` | normalize energy in colorizer | **Export** from `@hexolution/simulation` |
| `Rgba` | colorizer, palette, worker-protocol | **Export** type from `@hexolution/shared` (or re-export via simulation API if preferred for app ergonomics) |
| `base4toInt` | `program-triplet` → gene index | **Export** as `geneIdFromBases` from simulation |
| `chunk` | `program` → triplets | **Local frontend** — explicit gene grouping (e.g. step by 3), not a shared util |

Everything else simulation currently takes from `@/shared` stays inside packages; the app does not need it.

## DX / tooling

- Root `package.json`: `"workspaces": ["packages/*"]`
- Each package: `"name"`, `"private": true`, `"type": "module"`, `exports` pointing at TypeScript sources for Vite
- App imports: replace `@/simulation/...` with `@hexolution/simulation` (and subpath exports if needed)
- Root `npm test` runs vitest across app + packages (simulation tests move with the package; include `packages/*/src/**/*.test.ts`)
- Root `npm run build` / `dev` continue to build/serve the app; workspace packages are consumed as source

### Shared ESLint

- Keep a **single** root `eslint.config.js` that lints `src/**` and `packages/*/src/**`
- Same rule set for everyone (complexity, naming-convention, no `as` assertions, type imports, etc.)
- React Hooks / React Refresh plugins apply only to app/React files (e.g. `src/**/*.{ts,tsx}`); packages stay on the shared TS rules without React-specific constraints
- Root `npm run lint` remains the one command

### Shared TypeScript

- Extract common `compilerOptions` into root `tsconfig.base.json` (strictness, moduleResolution bundler, verbatimModuleSyntax, target, etc.)
- App (`tsconfig.app.json`) and each package `tsconfig.json` **extend** the base; packages omit DOM/JSX unless needed (`shared` / `simulation` are DOM-free)
- Root `tsconfig.json` project references include app + packages so `tsc -b` typechecks the workspace
- Vite checker / build continue to typecheck the app graph, which pulls in workspace packages via imports

## Migration outline

1. Add workspace root config, shared `tsconfig.base.json`, and scaffold `packages/shared`, `packages/simulation`
2. Point root ESLint + vitest at `packages/*`; wire TS project references
3. Move shared primitives into `@hexolution/shared`; update simulation imports
4. Move `src/simulation` into `@hexolution/simulation`; add public exports (`geneIdFromBases`, constants)
5. Point app + worker at the new packages; drop `@/simulation` path usage
6. Apply UI-local `lerpRgb` and program gene grouping; wire `geneIdFromBases` / `MAX_CELL_ENERGY` / `Rgba`
7. Ensure `npm run dev`, `npm test`, `npm run build`, `npm run lint` work from root

## Success criteria

- From repo root: `npm run dev`, `npm test`, `npm run build`, `npm run lint` work as before
- App and packages share one ESLint rule baseline and one TS base config
- Simulation has no imports from app source
- Program UI uses `geneIdFromBases`; colorizer uses local `lerpRgb` and imported `MAX_CELL_ENERGY`
- No `World` refactor in this change
