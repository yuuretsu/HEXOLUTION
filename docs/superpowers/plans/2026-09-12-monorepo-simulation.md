# Monorepo Simulation Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert HEXOLUTION to npm workspaces and extract `@hexolution/shared` + `@hexolution/simulation` while keeping root `dev` / `test` / `build` / `lint` as the single DX entry.

**Architecture:** App stays at repo root. Pure utils/types move to `@hexolution/shared`. Domain (`src/simulation` + sim constants) move to `@hexolution/simulation`. Packages export TypeScript sources for Vite; one root ESLint config and `tsconfig.base.json` cover everyone. Dependency direction: app → simulation → shared.

**Tech Stack:** npm workspaces, TypeScript project references, Vite 8, Vitest, ESLint flat config, existing React/Electron app.

**Spec:** `docs/superpowers/specs/2026-09-12-monorepo-simulation-design.md`  
**Branch:** `feat/monorepo-simulation`

---

## File map

| Path | Role |
| --- | --- |
| `package.json` | Add `workspaces`, depend on workspace packages |
| `tsconfig.base.json` | Shared compilerOptions |
| `tsconfig.json` | References: app, node, shared, simulation |
| `tsconfig.app.json` | Extends base; app paths `@/*` |
| `eslint.config.js` | Split React rules (app) vs shared TS rules (packages) |
| `vitest.config.ts` | Include `packages/*/src/**/*.test.ts` |
| `packages/shared/**` | New package: Rgba, utils, grid, pool, counter |
| `packages/simulation/**` | New package: former `src/simulation` + constants + public API |
| `src/shared/constants.ts` | App-only constants remain |
| `src/shared/types.ts` | Only `ViewMode`; `Rgba` from shared |
| `src/shared/utils/*` | Remove moved modules; keep `worker-api.ts` |
| `src/shared/render/grid-colorizer.ts` | Local `lerpRgb`; import `MAX_CELL_ENERGY` from simulation |
| `src/entities/selected-entity/ui/program*.tsx` | Local gene grouping; `geneIdFromBases` |
| `src/worker/*`, other app imports | `@hexolution/simulation` instead of `@/simulation` |

---

### Task 1: Workspace root + shared TypeScript base

**Files:**
- Create: `tsconfig.base.json`
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `tsconfig.app.json`
- Modify: `tsconfig.node.json`

- [ ] **Step 1: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "strict": true,
    "skipLibCheck": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "noEmit": true
  }
}
```

- [ ] **Step 2: Update root `package.json`**

Add workspaces and workspace deps (keep existing scripts/deps):

```json
{
  "workspaces": ["packages/*"],
  "dependencies": {
    "@hexolution/shared": "*",
    "@hexolution/simulation": "*",
    "clsx": "^2.1.1",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-icons": "^5.7.0"
  }
}
```

(Leave other fields as they are.)

- [ ] **Step 3: Point app/node tsconfigs at base**

`tsconfig.app.json` — keep app-specific options, extend base:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "jsx": "react-jsx",
    "useDefineForClassFields": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

`tsconfig.node.json`:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "types": ["node"],
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

`tsconfig.json` (references will grow in later tasks; for now keep app+node):

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json tsconfig.base.json tsconfig.json tsconfig.app.json tsconfig.node.json
git commit -m "chore: add npm workspaces and shared tsconfig base"
```

---

### Task 2: Scaffold `@hexolution/shared` and move primitives

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Move: `src/shared/types.ts` `Rgba` → `packages/shared/src/types.ts` (app keeps `ViewMode`)
- Move: `src/shared/utils/index.ts` → `packages/shared/src/utils/index.ts` (minus UI-only `chunk` if present — move all helpers; app will stop using chunk)
- Move: `src/shared/utils/object-pool.ts` → `packages/shared/src/object-pool.ts`
- Move: `src/shared/utils/counter.ts` → `packages/shared/src/counter.ts`
- Move: `src/shared/utils/grid/**` → `packages/shared/src/grid/**`

- [ ] **Step 1: Create package manifest**

`packages/shared/package.json`:

```json
{
  "name": "@hexolution/shared",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./grid": "./src/grid/index.ts"
  },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

`packages/shared/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.tsbuildinfo",
    "lib": ["ES2022"],
    "rootDir": "src",
    "composite": true
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Move files with git**

```bash
mkdir -p packages/shared/src
git mv src/shared/utils/object-pool.ts packages/shared/src/object-pool.ts
git mv src/shared/utils/counter.ts packages/shared/src/counter.ts
git mv src/shared/utils/grid packages/shared/src/grid
mkdir -p packages/shared/src/utils
git mv src/shared/utils/index.ts packages/shared/src/utils/index.ts
```

Keep `src/shared/utils/worker-api.ts` in the app.

- [ ] **Step 3: Create `packages/shared/src/types.ts`**

```ts
export type Rgba = [r: number, g: number, b: number, a: number];
```

Update `packages/shared/src/utils/index.ts` import:

```ts
import type { Rgba } from "../types";
```

Remove `chunk` from this file (UI-only; will be inlined in program UI). Keep: `choice`, `lerp`, `createRandom`, `lerpRgb`, `base4toInt`, `clampCycle`, `roundToEven`, `randomLightColorInto`, `randomLightColor`, `mutateColorInto`, `mutateColor`, `hslaToRgba`.

- [ ] **Step 4: Create barrel `packages/shared/src/index.ts`**

```ts
export type { Rgba } from "./types";
export {
  choice,
  lerp,
  createRandom,
  lerpRgb,
  base4toInt,
  clampCycle,
  roundToEven,
  randomLightColorInto,
  randomLightColor,
  mutateColorInto,
  mutateColor,
  hslaToRgba,
} from "./utils/index";
export { ObjectPool } from "./object-pool";
export { Counter } from "./counter";
export { GridMap, GridMatrix, type IGrid } from "./grid";
```

Verify `packages/shared/src/grid/index.ts` exports `GridMap`, `GridMatrix`, `IGrid` (add `GridMatrix` export if missing).

- [ ] **Step 5: Slim app `src/shared/types.ts`**

```ts
export type { Rgba } from "@hexolution/shared";
export type ViewMode = "normal" | "energy" | "genome-hash" | "coloration" | "last-action";
```

(Or import `Rgba` only where needed from `@hexolution/shared` and leave this file as ViewMode-only — prefer re-export for fewer app churns.)

- [ ] **Step 6: Delete empty leftovers under `src/shared/utils/` except `worker-api.ts`**

If `src/shared/utils/` only has `worker-api.ts`, leave that file. Do not leave a broken `index.ts`.

- [ ] **Step 7: Add shared to root references**

In `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" },
    { "path": "./packages/shared" }
  ]
}
```

- [ ] **Step 8: Install workspaces**

```bash
npm install
```

Expected: `@hexolution/shared` linked under root `node_modules`.

- [ ] **Step 9: Commit**

```bash
git add packages/shared package.json package-lock.json tsconfig.json src/shared
git commit -m "feat: add @hexolution/shared package"
```

---

### Task 3: Scaffold `@hexolution/simulation` and move domain

**Files:**
- Create: `packages/simulation/package.json`
- Create: `packages/simulation/tsconfig.json`
- Create: `packages/simulation/src/index.ts`
- Create: `packages/simulation/src/constants.ts`
- Create: `packages/simulation/src/gene-id.ts`
- Move: entire `src/simulation/**` → `packages/simulation/src/**` (preserve tree; drop nested `simulation` folder name — contents become package `src/`)

- [ ] **Step 1: Create package manifest**

`packages/simulation/package.json`:

```json
{
  "name": "@hexolution/simulation",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./api/types": "./src/api/types.ts",
    "./api/grid-layout": "./src/api/grid-layout.ts",
    "./api/grid-publisher": "./src/api/grid-publisher.ts",
    "./api/gene-meta": "./src/api/gene-meta.ts"
  },
  "dependencies": {
    "@hexolution/shared": "*"
  },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

`packages/simulation/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.tsbuildinfo",
    "lib": ["ES2022"],
    "rootDir": "src",
    "composite": true
  },
  "include": ["src"],
  "references": [{ "path": "../shared" }]
}
```

- [ ] **Step 2: Move simulation tree**

```bash
mkdir -p packages/simulation
git mv src/simulation packages/simulation/src
```

- [ ] **Step 3: Add simulation constants**

`packages/simulation/src/constants.ts`:

```ts
/** Max cell energy; the creature dies if this is exceeded. */
export const MAX_CELL_ENERGY = 1000;

/** Per-cell contribution to the world's total energy budget. */
export const ENERGY_PER_CELL = 100;

/** Creature genome length in base units. */
export const GENOME_LENGTH = 32 * 3;

/** Number of genes a creature executes per tick. */
export const GENES_PER_TICK = 16;

/** Per-base mutation probability when reproducing. */
export const GENOME_MUTATION_RATE = 0.001;

/** Random coloration shift strength on reproduction. */
export const COLORATION_MUTATION_RATE = 10;

/** Age-based energy drain multiplier: age × factor per tick. */
export const AGE_ENERGY_COST_FACTOR = 0.0005;
```

Remove these same exports from `src/shared/constants.ts` (keep world size, speed, spawn, hex math re-exports).

- [ ] **Step 4: Add `geneIdFromBases`**

`packages/simulation/src/gene-id.ts`:

```ts
import { base4toInt } from "@hexolution/shared";

/** Encode three base-4 genome bases into a gene id (same encoding as Tape.readInt). */
export const geneIdFromBases = (a: number, b: number, c: number): number =>
  base4toInt(a, b, c);
```

- [ ] **Step 5: Write failing test for `geneIdFromBases`**

`packages/simulation/src/gene-id.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { geneIdFromBases } from "./gene-id";

describe("geneIdFromBases", () => {
  it("encodes three bases as a*16 + b*4 + c", () => {
    expect(geneIdFromBases(1, 2, 3)).toBe(1 * 16 + 2 * 4 + 3);
    expect(geneIdFromBases(0, 0, 0)).toBe(0);
    expect(geneIdFromBases(3, 3, 3)).toBe(63);
  });
});
```

- [ ] **Step 6: Rewrite internal imports in `packages/simulation/src`**

Replace:

| From | To |
| --- | --- |
| `@/shared/types` | `@hexolution/shared` |
| `@/shared/utils` | `@hexolution/shared` |
| `@/shared/utils/object-pool` | `@hexolution/shared` |
| `@/shared/utils/counter` | `@hexolution/shared` |
| `@/shared/utils/grid` | `@hexolution/shared` or `@hexolution/shared/grid` |
| `@/shared/constants` (sim constants) | `../constants` or `@hexolution/simulation` relative `./constants` |
| `@/simulation/...` | relative imports within package (e.g. `../world`, `./creature`) |

Prefer relative imports inside the package for sibling modules. Use `@hexolution/shared` for shared.

In `tape.ts`, `creature.ts`, `grid-publisher.ts`: call `geneIdFromBases` instead of `base4toInt` where encoding gene ids (or keep `base4toInt` internally and only export `geneIdFromBases` as the public alias — either is fine if `geneIdFromBases` === `base4toInt` formula; prefer using `geneIdFromBases` in Tape/`grid-publisher`/creature for one code path).

- [ ] **Step 7: Public barrel `packages/simulation/src/index.ts`**

```ts
export {
  MAX_CELL_ENERGY,
  ENERGY_PER_CELL,
  GENOME_LENGTH,
  GENES_PER_TICK,
  GENOME_MUTATION_RATE,
  COLORATION_MUTATION_RATE,
  AGE_ENERGY_COST_FACTOR,
} from "./constants";
export { geneIdFromBases } from "./gene-id";
export {
  World,
  WorldItemStatic,
  WorldItemDynamic,
  sendEnergy,
  type WorldItem,
} from "./world";
export { Creature } from "./creature";
export { Organic } from "./organic";
export { Stone } from "./stone";
export { Tape, getRandomBase4, type Base4 } from "./tape";
export { Dichotomy } from "./dichotomy";
export { GridPublisher } from "./api/grid-publisher";
export { getGeneMeta } from "./api/gene-meta";
export {
  CellKind,
  GRID_LAYOUT_VERSION,
  LAST_GENE_NONE,
  readCell,
  // …re-export other public layout symbols currently imported by the app
} from "./api/grid-layout";
export type {
  GeneMeta,
  GridBufferMeta,
  Rgb,
  CellSnapshot,
} from "./api/types";
```

Match exact named exports currently imported from `@/simulation/...` in the app (grep before finalizing).

- [ ] **Step 8: Wire root references + install**

Add `{ "path": "./packages/simulation" }` to root `tsconfig.json`. Run `npm install`.

- [ ] **Step 9: Update vitest include**

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "packages/*/src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
```

- [ ] **Step 10: Run gene-id test**

```bash
npm test -- packages/simulation/src/gene-id.test.ts
```

Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add packages/simulation src/shared/constants.ts tsconfig.json vitest.config.ts package-lock.json
git commit -m "feat: add @hexolution/simulation package"
```

---

### Task 4: Point app + worker at packages

**Files:**
- Modify: all app/worker files that import `@/simulation/...` or moved shared modules
- Modify: `src/shared/constants.ts` (already trimmed)
- Modify: `tsconfig.app.json` if needed for workspace resolution (Vite `tsconfigPaths` + node resolution of workspace packages should suffice)

- [ ] **Step 1: Replace `@/simulation` imports**

Examples:

```ts
// before
import { World, WorldItemDynamic, type WorldItem } from "@/simulation/world";
import { GridPublisher } from "@/simulation/api/grid-publisher";
import type { GeneMeta, GridBufferMeta } from "@/simulation/api/types";
import { Creature } from "@/simulation/creature";

// after
import {
  World,
  WorldItemDynamic,
  type WorldItem,
  GridPublisher,
  type GeneMeta,
  type GridBufferMeta,
  Creature,
} from "@hexolution/simulation";
```

Or keep subpath imports if barrel is incomplete:

```ts
import type { GeneMeta } from "@hexolution/simulation/api/types";
```

Files to update (at minimum):

- `src/worker/simulation.ts`
- `src/worker/index.ts`
- `src/worker/world-generator.ts`
- `src/worker/selected-item.ts`
- `src/shared/worker-protocol.ts`
- `src/shared/gene-meta-store.ts`
- `src/shared/hooks/use-gene-meta.ts`
- `src/shared/render/grid-colorizer.ts`
- `src/shared/render/grid-colorizer.test.ts`
- `src/widgets/world-image/index.tsx`

- [ ] **Step 2: Fix app imports of moved shared modules**

`src/worker/world-generator.ts`:

```ts
import type { IGrid } from "@hexolution/shared";
```

Any remaining `@/shared/utils` (except worker-api) must go.

- [ ] **Step 3: Ensure no `@/simulation` left**

```bash
rg "@/simulation" src packages || true
```

Expected: no matches under `src/`. Packages must not import `@/`.

```bash
rg "from \"@/" packages || true
```

Expected: no matches.

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all existing tests pass (grid-publisher, grid-layout, gene-meta, grid-colorizer, gene-id).

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "refactor: consume simulation and shared workspace packages from app"
```

---

### Task 5: UI-local helpers per spec

**Files:**
- Modify: `src/shared/render/grid-colorizer.ts`
- Modify: `src/entities/selected-entity/ui/program.tsx`
- Modify: `src/entities/selected-entity/ui/program-triplet.tsx`
- Modify: `src/shared/render/view-palette.ts` (Rgba import if needed)
- Modify: `src/shared/worker-protocol.ts` (Rgba from shared)

- [ ] **Step 1: Local `lerpRgb` in colorizer**

In `src/shared/render/grid-colorizer.ts`, remove import of `lerpRgb` from utils. Add local:

```ts
import { MAX_CELL_ENERGY } from "@hexolution/simulation";
import type { Rgba } from "@hexolution/shared";
// remove: import { lerpRgb } from "@/shared/utils"
// remove: import { MAX_CELL_ENERGY } from "@/shared/constants"

const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

const lerpRgb = (a: Rgba, b: Rgba, t: number) => {
  a[0] = lerp(a[0], b[0], t);
  a[1] = lerp(a[1], b[1], t);
  a[2] = lerp(a[2], b[2], t);
};
```

Keep using name `lerpRgb` in `energyColor` / `organicNormalColor`.

- [ ] **Step 2: Program gene grouping without `chunk`**

`src/entities/selected-entity/ui/program.tsx`:

```tsx
import type { FC } from "react";
import { ProgramTriplet } from "./program-triplet";
import styles from "./program.module.css";

type ProgramProps = {
  program: number[];
  activeGeneIndices?: number[];
};

const groupIntoGenes = (program: number[]): number[][] => {
  const genes: number[][] = [];
  for (let i = 0; i < program.length; i += 3) {
    genes.push(program.slice(i, i + 3));
  }
  return genes;
};

export const Program: FC<ProgramProps> = ({
  program,
  activeGeneIndices = [],
}) => {
  const triplets = groupIntoGenes(program);
  const activeSet = new Set(activeGeneIndices);
  const lastGeneIndex = activeGeneIndices.at(-1);

  return (
    <div>
      <div className={styles.programGrid}>
        {triplets.map((bases, i) => (
          <ProgramTriplet
            key={i}
            bases={bases}
            isActive={activeSet.has(i)}
            isLast={i === lastGeneIndex}
          />
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: `geneIdFromBases` in program-triplet**

```tsx
import { geneIdFromBases } from "@hexolution/simulation";
// remove: import { base4toInt } from "@/shared/utils"

const n = geneIdFromBases(bases[0], bases[1], bases[2]);
```

- [ ] **Step 4: Run colorizer + unit tests**

```bash
npm test
npm run lint
```

Expected: PASS / lint clean (or only pre-existing issues unrelated to this change).

- [ ] **Step 5: Commit**

```bash
git add src/shared/render/grid-colorizer.ts src/entities/selected-entity/ui/program.tsx src/entities/selected-entity/ui/program-triplet.tsx src/shared/types.ts src/shared/worker-protocol.ts src/shared/render/view-palette.ts
git commit -m "refactor(ui): local lerpRgb and gene helpers; use simulation exports"
```

---

### Task 6: Shared ESLint for packages

**Files:**
- Modify: `eslint.config.js`

- [ ] **Step 1: Split config — shared TS rules + React-only for app**

Replace `eslint.config.js` with:

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const sharedTsRules = {
  'func-style': ['error', 'expression'],
  complexity: ['error', 10],
  '@typescript-eslint/consistent-type-imports': ['error', {
    prefer: 'type-imports',
    fixStyle: 'separate-type-imports',
  }],
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/naming-convention': [
    'error',
    {
      selector: ['variable', 'parameter', 'classProperty', 'typeProperty', 'accessor'],
      types: ['boolean'],
      format: ['PascalCase'],
      prefix: [
        'is', 'are', 'was', 'were', 'has', 'have', 'had',
        'can', 'could', 'should', 'did', 'will', 'needs',
      ],
    },
  ],
  'no-restricted-syntax': [
    'error',
    {
      selector: 'TSTypeAssertion',
      message: 'Type assertions are forbidden. Prefer proper typing or type guards.',
    },
    {
      selector: 'TSAsExpression:not([typeAnnotation.typeName.name="const"])',
      message: 'Type assertions (`as`) are forbidden, except `as const`.',
    },
  ],
}

export default defineConfig([
  globalIgnores(['dist', 'release', '**/node_modules/**']),
  {
    files: ['packages/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: sharedTsRules,
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
  },
])
```

- [ ] **Step 2: Lint from root**

```bash
npm run lint
```

Expected: exit 0 (fix any new package path issues).

- [ ] **Step 3: Commit**

```bash
git add eslint.config.js
git commit -m "chore(lint): apply shared ESLint rules to workspace packages"
```

---

### Task 7: End-to-end verify root DX

**Files:** none new (verification only; fix stragglers if found)

- [ ] **Step 1: Typecheck / build**

```bash
npm run build
```

Expected: `tsc -b` + Vite build succeed.

- [ ] **Step 2: Tests + lint**

```bash
npm test
npm run lint
```

Expected: pass.

- [ ] **Step 3: Smoke `dev` (optional short run)**

```bash
npm run dev
```

Expected: Vite starts without resolve errors for `@hexolution/*`.

- [ ] **Step 4: Final sanity greps**

```bash
test ! -d src/simulation
rg "@/simulation" src || true
rg "from \"@/" packages || true
rg "MAX_CELL_ENERGY" src/shared/constants.ts || true
```

Expected: no `src/simulation`; no app `@/simulation`; packages don’t import `@/`; `MAX_CELL_ENERGY` gone from app constants.

- [ ] **Step 5: Commit any leftover fixes**

```bash
git add -A
git status
# only if there are fixes:
git commit -m "fix: finish monorepo wiring"
```

---

## Spec coverage checklist

| Spec item | Task |
| --- | --- |
| npm workspaces, app at root | 1 |
| `@hexolution/shared` contents | 2 |
| `@hexolution/simulation` + constants + `geneIdFromBases` | 3 |
| App consumes packages; no sim→app imports | 4 |
| Local `lerpRgb`, `geneIdFromBases`, gene grouping, `MAX_CELL_ENERGY` export | 5 |
| Shared ESLint + TS base | 1, 6 |
| Root `dev`/`test`/`build`/`lint` | 7 |
| No World refactor / no worker package / no turbo | (non-goals, untouched) |
