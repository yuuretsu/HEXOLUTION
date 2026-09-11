import { getGeneColor, getGeneHandler } from "@/simulation/creature/genes";
import type { FC } from "react";
import { useWorkerEvent } from "@/shared/hooks/use-worker-event";
import { Stack } from "@/shared/ui/stack";
import { Text } from "@/shared/ui/text";
import { base4toInt, chunk } from "@/shared/utils";
import styles from "./selected-entity.module.css";

type ProgramProps = {
  program: number[];
  activeGeneIndices?: number[];
};

const Program: FC<ProgramProps> = ({ program, activeGeneIndices = [] }) => {
  const triplets = chunk(program, 3);
  const activeSet = new Set(activeGeneIndices);
  const lastGeneIndex = activeGeneIndices.at(-1);

  return (
    <div>
      <div className={styles.programGrid}>
        {triplets.map((triplet, i) => {
          const n = base4toInt(triplet[0], triplet[1], triplet[2]);
          const handler = getGeneHandler(n);
          const geneColor = getGeneColor(handler);
          const symbols = triplet.map((x) => ["A", "T", "G", "C"][x]);
          const backgroundColor = `rgba(${geneColor[0]}, ${geneColor[1]}, ${geneColor[2]}, 0.3)`;
          const activityColor = i === lastGeneIndex
            ? "#ffffff"
            : activeSet.has(i)
              ? "#888888"
              : undefined;

          return (
            <div key={i}>
              <div
                className={styles.programCell}
                style={{
                  backgroundColor,
                  color: `rgba(${geneColor[0]}, ${geneColor[1]}, ${geneColor[2]})`,
                }}
                title={handler.name}
              >
                <Stack dir="row" justify="around">
                  {symbols.map((x, i) => (
                    <Text key={i}>{x}</Text>
                  ))}
                </Stack>
                <div
                  className={styles.programCellActivity}
                  style={activityColor ? { backgroundColor: activityColor } : undefined}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WorldEntityCreature: FC<{ item: any }> = ({ item }) => {
  const program = item.program as number[];
  return (
    <Stack dir="column" gap={16}>
      <table className={styles.infoTable}>
        <tbody>
          <tr>
            <th><Text>ENERGY</Text></th>
            <td><Text>{item.energy}</Text></td>
          </tr>
          <tr>
            <th><Text>AGE</Text></th>
            <td><Text>{item.age}</Text></td>
          </tr>
          <tr>
            <th><Text>GENERATION</Text></th>
            <td><Text>{item.generation}</Text></td>
          </tr>
          <tr>
            <th><Text>COLORATION</Text></th>
            <td>
              <div className={styles.colorationRow}>
                <Stack dir="row" gap={6} align="center">
                  <span
                    className={styles.colorationSwatch}
                    style={{ backgroundColor: `rgba(${item.coloration[0]}, ${item.coloration[1]}, ${item.coloration[2]}, ${item.coloration[3] / 255})` }}
                  />
                  <Text>
                    {item.coloration[0]}, {item.coloration[1]}, {item.coloration[2]}
                  </Text>
                </Stack>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <Program
        program={program}
        activeGeneIndices={item.activeGeneIndices}
      />
    </Stack>
  );
};

export const SelectedEntity: FC = () => {
  const selectedItem = useWorkerEvent("selectedItemUpdate");

  if (!selectedItem) return (
    <Text size="sm" isMuted isItalic>
      Click an entity to view its properties
    </Text>
  )

  const [r, g, b] = selectedItem.color;

  return (
    <Stack dir="column" gap={16}>
      <Stack dir="row" gap={6} align="center">
        <div
          className={styles.entitySwatch}
          style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
        />
        <Text as="h3" isUppercase className={styles.selectedTitle}>
          {selectedItem.type}
        </Text>
      </Stack>
      {selectedItem.type === "Creature" && <WorldEntityCreature item={selectedItem} />}
    </Stack>
  );
};
