# NN Creatures — Design

Date: 2026-09-12  
Status: approved for planning

## Goal

Add neural-network creatures as a separate living-cell lineage. First slice: sense local colors, choose among turn / move / reproduce, eat organic by walking onto it. World runs in **nn-only** mode (no genome creatures spawned).

## Non-goals (this slice)

- Photosynthesis, attack, push, genome tape
- RL / shared trained policy
- UI toggle between genome and NN modes (nn-only is hardcoded for now)
- Rich inspector for weights

## Architecture

### Shared base: `LivingCell`

Extract shared life-cycle from today’s `Creature` into `LivingCell extends WorldItemDynamic`:

- Fields: `energy`, `direction`, `age`, `generation`, `color`, `coloration`
- Behavior: age energy drain, death when energy ≤ 0 or ≥ `MAX_CELL_ENERGY`, `die` → replace cell with `Organic`
- Color accessors used by render / selection

`Creature` keeps genome tape, genes, dichotomy, genome hash.  
`NnCreature` keeps brain weights and NN action loop.

**Rule:** if publisher, selection, movement, or energy helpers start branching on `Creature | NnCreature`, introduce a shared type, base, or generic — do not duplicate parallel `instanceof` chains.

### `NnCreature`

Each tick:

1. Death check (inherited).
2. Sense: RGB of all hexes in **radius 2** except self → **18 cells × 3 = 54** inputs, values in `0…1`.
3. Empty cell → `(0, 0, 0)`.
4. Occupied cell → same RGB as published `display` color for that item.
5. Neighborhood order is **facing-relative** (rotated by `direction`) so “forward” indices stay stable.
6. Feedforward **54 → 16 → 4**, argmax → one action.
7. Apply age energy cost (same factor as genome creatures).

### Actions

| Action | Effect |
|--------|--------|
| `turnLeft` | `direction -= 1` (mod 6) |
| `turnRight` | `direction += 1` (mod 6) |
| `go` | Pay `MOVE_ENERGY_COST`. Forward empty → step. Forward organic → absorb organic energy, clear organic, step onto cell. Forward stone/creature → no move (cost still paid). |
| `reproduce` | Pay `REPRODUCE_ENERGY_COST`; require `REPRODUCE_MIN_ENERGY`; forward must be empty; spawn child with copied+mutated weights; transfer fixed energy fraction (e.g. `0.4`) to child. |

### Brain

- Weights in `Float32Array` (or equivalent flat layout).
- Spawn: random init.
- Reproduce: copy weights + Gaussian mutation (`NN_WEIGHT_MUTATION_STD ≈ 0.05`).
- No bias toward classification tokens — vision is raw color only.

### World generation

- Stones unchanged.
- Replace genome creature spawn with `NnCreature` + `INITIAL_CREATURE_ENERGY`.
- Mode: **nn-only** (constant/flag in worker); genome `populateWorld` path unused while flag is set.

### Rendering & API

- `GridPublisher`: treat `NnCreature` as `CellKind.Creature` via `LivingCell` (or shared render snapshot), not a new cell kind.
- `display` = creature color; optional stable tint from weight hash into `coloration` / hash slots for lineage visibility.
- `serializeSelectedItem`: type `"NnCreature"` with color, direction, age, generation, energy (no tape). Genome-only fields stay on `"Creature"`.

### Movement helpers

Shared helpers (not `GeneContext`) operate on `LivingCell` + world coords for move / eat-on-step / place child. Genome genes keep using `GeneContext`; NN does not force itself through gene handlers.

## File layout

```
packages/simulation/src/
  living-cell.ts          # shared base (name may vary)
  creature/creature.ts    # extends LivingCell
  nn-creature/
    nn-creature.ts
    brain.ts
    sense.ts
    constants.ts
```

Touches: `grid-publisher.ts`, `world-generator.ts`, `selected-item.ts`, shared selection types, `index.ts` exports.

## Testing

- `sense`: empty → zeros; occupied → display RGB; rotating `direction` permutes the buffer as expected.
- `brain`: weight buffer size; mutate changes copy, leaves source intact.
- `go`: stepping onto organic absorbs energy and occupies the cell.
- `reproduce`: empty forward + enough energy → child with mutated weights; blocked if occupied.
- Publisher/selection accept `NnCreature` without throwing.

## Success criteria

- Fresh world fills with NN creatures (and stones), no genome tapes.
- Creatures turn and walk; organic piles shrink when walked onto.
- Population can grow via reproduce + mutation; deaths still leave organic.
