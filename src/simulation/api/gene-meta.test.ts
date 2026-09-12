import { describe, expect, it } from "vitest";
import { getGeneMeta } from "./gene-meta";

describe("getGeneMeta", () => {
  it("returns stable ids matching handler order", () => {
    const meta = getGeneMeta();
    expect(meta.length).toBeGreaterThan(0);
    expect(meta[0]).toMatchObject({ id: 0, name: expect.any(String) });
    expect(meta[0].color).toHaveLength(4);
    expect(meta.map((g) => g.id)).toEqual(meta.map((_, i) => i));
    expect(getGeneMeta()).toEqual(meta);
  });
});
