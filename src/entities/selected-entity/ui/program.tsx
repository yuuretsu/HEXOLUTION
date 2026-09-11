import type { FC } from "react";
import { chunk } from "@/shared/utils";
import { ProgramTriplet } from "./program-triplet";
import styles from "./program.module.css";

type ProgramProps = {
  program: number[];
  activeGeneIndices?: number[];
};

export const Program: FC<ProgramProps> = ({
  program,
  activeGeneIndices = [],
}) => {
  const triplets = chunk(program, 3);
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
