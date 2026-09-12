import { useEffect, useState } from "react";
import type { GeneMeta } from "@/simulation/api/types";
import { getCachedGeneMeta, loadGeneMeta } from "@/shared/gene-meta-store";

export const useGeneMeta = (): GeneMeta[] => {
  const [genes, setGenes] = useState<GeneMeta[]>(getCachedGeneMeta);
  useEffect(() => {
    void loadGeneMeta().then(setGenes);
  }, []);
  return genes;
};
