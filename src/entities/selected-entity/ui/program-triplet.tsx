import { getGeneColor, getGeneHandler } from "@/simulation/creature/genes";
import type { FC } from "react";
import { Stack } from "@/shared/ui/stack";
import { Text } from "@/shared/ui/text";
import { base4toInt } from "@/shared/utils";
import styles from "./program-triplet.module.css";

type ProgramTripletProps = {
  bases: number[];
  isActive: boolean;
  isLast: boolean;
};

export const ProgramTriplet: FC<ProgramTripletProps> = ({
  bases,
  isActive,
  isLast,
}) => {
  const n = base4toInt(bases[0], bases[1], bases[2]);
  const handler = getGeneHandler(n);
  const geneColor = getGeneColor(handler);
  const symbols = bases.map((x) => ["A", "T", "G", "C"][x]);
  const backgroundColor = `rgba(${geneColor[0]}, ${geneColor[1]}, ${geneColor[2]}, 0.3)`;
  const activityColor = isLast
    ? "#ffffff"
    : isActive
      ? "#888888"
      : undefined;

  return (
    <div
      className={styles.programCell}
      style={{
        backgroundColor,
        color: `rgba(${geneColor[0]}, ${geneColor[1]}, ${geneColor[2]})`,
      }}
      title={handler.name}
    >
      <Stack dir="row" justify="around">
        {symbols.map((symbol, i) => (
          <Text key={i}>{symbol}</Text>
        ))}
      </Stack>
      <div
        className={styles.programCellActivity}
        style={activityColor ? { backgroundColor: activityColor } : undefined}
      />
    </div>
  );
};
