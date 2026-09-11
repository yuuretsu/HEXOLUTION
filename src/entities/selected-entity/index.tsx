import type { FC } from "react";
import { useWorkerEvent } from "@/shared/hooks/use-worker-event";
import type { SelectedCreatureData } from "@/shared/worker-protocol";
import { Stack } from "@/shared/ui/stack";
import { Text } from "@/shared/ui/text";
import { chunk } from "@/shared/utils";
import { ProgramTriplet } from "./ui/program-triplet";
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

export const WorldEntityCreature: FC<{ item: SelectedCreatureData }> = ({ item }) => {
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
        program={item.program}
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
