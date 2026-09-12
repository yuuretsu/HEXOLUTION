import { describe, expect, it } from "vitest";
import { geneIdFromBases } from "./gene-id";

describe("geneIdFromBases", () => {
  it("encodes three bases as a*16 + b*4 + c", () => {
    expect(geneIdFromBases(1, 2, 3)).toBe(1 * 16 + 2 * 4 + 3);
    expect(geneIdFromBases(0, 0, 0)).toBe(0);
    expect(geneIdFromBases(3, 3, 3)).toBe(63);
  });
});
