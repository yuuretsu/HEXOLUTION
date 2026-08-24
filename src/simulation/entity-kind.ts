export const EntityKind = {
  Creature: "Creature",
  Food: "Food",
  Stone: "Stone",
} as const;

export type EntityKind = (typeof EntityKind)[keyof typeof EntityKind];
