import { geneInfoFromTriplet } from "@/shared/gene-ui";
import type { FC } from "react";
import { useWorkerEvent } from "@/shared/hooks/use-worker-event";
import { chunk } from "@/shared/utils";
import styles from "./selected-entity.module.css";

type ProgramProps = {
  program: number[];
  pointer: number;
};

const Program: FC<ProgramProps> = ({ program }) => {
  const triplets = chunk(program, 3);

  return (
    <div>
      <div className={styles.programGrid}>
        {triplets.map((triplet, i) => {
          const gene = geneInfoFromTriplet(triplet[0], triplet[1], triplet[2]);
          const symbols = triplet.map((x) => ["A", "T", "G", "C"][x]);
          const color = gene.color;

          return (
            <div key={i}>
              <div
                className={styles.programCell}
                style={{
                  backgroundColor: color ? `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.3)` : "rgba(255, 255, 255, 0.1)",
                  color: color ? `rgba(${color[0]}, ${color[1]}, ${color[2]})` : "rgba(255, 255, 255, 0.1)",
                }}
                title={gene.name}
              >
                {symbols.map((x, i) => {
                  return (
                    <div key={i}>{x}</div>
                  )
                })}
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
    <div className={styles.creatureInfo}>
      <table className={styles.infoTable}>
        <tbody>
          <tr>
            <th>ENERGY</th>
            <td>{item.energy}</td>
          </tr>
          <tr>
            <th>AGE</th>
            <td>{item.age}</td>
          </tr>
          <tr>
            <th>COLORATION</th>
            <td>
              <div className={styles.colorationRow}>
                <span
                  className={styles.colorationSwatch}
                  style={{ backgroundColor: `rgba(${item.coloration[0]}, ${item.coloration[1]}, ${item.coloration[2]}, ${item.coloration[3] / 255})` }}
                />
                <span>
                  {item.coloration[0]}, {item.coloration[1]}, {item.coloration[2]}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <Program program={program} pointer={item.pointer} />
    </div>
  );
};

export const SelectedEntity: FC = () => {
  const selectedItem = useWorkerEvent("selectedItemUpdate");

  if (!selectedItem) return (
    <div className={styles.emptyHint}>
      Click an entity to view its properties
    </div>
  )

  const [r, g, b] = selectedItem.color;

  return (
    <div className={styles.creatureInfo}>
      <div className={styles.selectedHeader}>
        <div
          className={styles.entitySwatch}
          style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
        />
        <h3 className={styles.selectedTitle}>{selectedItem.type.toUpperCase()}</h3>
      </div>
      {selectedItem.type === "Creature" && <WorldEntityCreature item={selectedItem} />}
    </div>
  );
};
