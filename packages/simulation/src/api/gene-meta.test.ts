import { describe, expect, it } from "vitest";
import { getGeneMeta } from "./gene-meta";

describe("getGeneMeta", () => {
  it("returns stable ids matching handler order", () => {
    const meta = getGeneMeta();
    expect(meta.length).toBeGreaterThan(0);
    const first = meta[0]!;
    expect(first).toMatchObject({ id: 0, name: expect.any(String) });
    expect(first.color).toHaveLength(4);
    expect(meta.map((g) => g.id)).toEqual(meta.map((_, i) => i));
    expect(getGeneMeta()).toEqual(meta);
  });
});
