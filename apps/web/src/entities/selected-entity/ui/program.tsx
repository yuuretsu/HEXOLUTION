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
