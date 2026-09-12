import { getGeneColor } from "@/simulation/creature/gene-colors";
import { GENE_HANDLERS } from "@/simulation/creature/gene-library";
import type { GeneMeta } from "./types";

let cached: GeneMeta[] | null = null;

export const getGeneMeta = (): GeneMeta[] => {
  if (cached) return cached;
  cached = GENE_HANDLERS.map((handler, id) => {
    const color = getGeneColor(handler);
    return {
      id,
      name: handler.name,
      color: [color[0], color[1], color[2], color[3]],
    };
  });
  return cached;
};
