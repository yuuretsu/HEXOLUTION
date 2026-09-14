import type { FC } from "react";
import { ProgramTriplet, type Triplet } from "./program-triplet";
import styles from "./program.module.css";

type ProgramProps = {
  program: number[];
  activeGeneIndices?: number[];
};

const groupIntoTriplets = (program: number[]): Triplet[] => {
  const triplets: Triplet[] = [];
  for (let i = 0; i < program.length; i += 3) {
    triplets.push([program[i]!, program[i + 1]!, program[i + 2]!]);
  }
  return triplets;
};

export const Program: FC<ProgramProps> = ({
  program,
  activeGeneIndices = [],
}) => {
  const triplets = groupIntoTriplets(program);
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
