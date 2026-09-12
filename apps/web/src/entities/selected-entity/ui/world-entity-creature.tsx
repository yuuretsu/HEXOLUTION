import type { FC } from "react";
import type { SelectedCreatureData } from "@/shared/api";
import { Stack } from "@/shared/ui/stack";
import { Text } from "@/shared/ui/text";
import { Program } from "./program";
import styles from "./world-entity-creature.module.css";

export const WorldEntityCreature: FC<{ item: SelectedCreatureData }> = ({
  item,
}) => {
  return (
    <Stack dir="column" gap={16}>
      <table className={styles.infoTable}>
        <tbody>
          <tr>
            <th>
              <Text>ENERGY</Text>
            </th>
            <td>
              <Text>{item.energy}</Text>
            </td>
          </tr>
          <tr>
            <th>
              <Text>AGE</Text>
            </th>
            <td>
              <Text>{item.age}</Text>
            </td>
          </tr>
          <tr>
            <th>
              <Text>GENERATION</Text>
            </th>
            <td>
              <Text>{item.generation}</Text>
            </td>
          </tr>
          <tr>
            <th>
              <Text>COLORATION</Text>
            </th>
            <td>
              <div className={styles.colorationRow}>
                <Stack dir="row" gap={6} align="center">
                  <span
                    className={styles.colorationSwatch}
                    style={{
                      backgroundColor: `rgba(${item.coloration[0]}, ${item.coloration[1]}, ${item.coloration[2]}, ${item.coloration[3] / 255})`,
                    }}
                  />
                  <Text>
                    {item.coloration[0]}, {item.coloration[1]},{" "}
                    {item.coloration[2]}
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
