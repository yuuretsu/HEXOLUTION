import { useEffect, useState } from "react";
import type { GeneMeta } from "@hexolution/simulation";
import { getCachedGeneMeta, loadGeneMeta } from "./gene-meta-store";

export const useGeneMeta = (): GeneMeta[] => {
  const [genes, setGenes] = useState<GeneMeta[]>(getCachedGeneMeta);
  useEffect(() => {
    void loadGeneMeta().then(setGenes);
  }, []);
  return genes;
};
