import { attackForward, inspectForward, COLOR_ATTACK, COLOR_MOVE_FORWARD, COLOR_PHOTOSYNTHESIS, COLOR_PUSH, getGeneHandler, moveForward, absorbLight, displaceForward, reproduce } from "creature/genes";
import type { FC } from "react";
import { Hexagon } from "ui/hexagon";
import { useWorkerEvent } from "use-worker-event";
import { base4toInt, chunk } from "utils";

type ProgramProps = {
  program: number[];
  pointer: number;
};

const Program: FC<ProgramProps> = ({ program, pointer }) => {
  const triplets = chunk(program, 3);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", borderRadius: 8, overflow: "hidden" }}>
        {triplets.map((triplet, i) => {
          const bgc = Math.floor(pointer / 3) === i ? "rgba(0, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.1)";

          const n = base4toInt(triplet[0], triplet[1], triplet[2]);

          const handler = getGeneHandler(n);

          // const text = triplet.map((x) => ["A", "T", "G", "C"][x]).join("")
          const symbols = triplet.map((x) => ["A", "T", "G", "C"][x]);

          const color = {
            [absorbLight.name]: COLOR_PHOTOSYNTHESIS,
            [attackForward.name]: COLOR_ATTACK,
            [reproduce.name]: [255, 255, 255, 255],
            [moveForward.name]: COLOR_MOVE_FORWARD,
            [displaceForward.name]: COLOR_PUSH,
            [inspectForward.name]: [255, 255, 0, 255],
          }[handler.name];

          return (
            <div key={i}>
              <div
                style={{
                  backgroundColor: color ? `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.3)` : "rgba(255, 255, 255, 0.1)",
                  color: color ? `rgba(${color[0]}, ${color[1]}, ${color[2]})` : "rgba(255, 255, 255, 0.1)",
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "space-around",
                  fontWeight: "bold"
                }}
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
export const SelectedItemCreature: FC<{ item: any }> = ({ item }) => {
  const program = item.program as number[];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <table style={{ width: "100%" }}>
        <tbody>
          <tr>
            <th>ENERGY</th>
            <td>{item.energy}</td>
          </tr>
          <tr>
            <th>AGE</th>
            <td>{item.age}</td>
          </tr>
        </tbody>
      </table>
      <Program program={program} pointer={item.pointer} />
    </div>
  );
};

export const SelectedItem: FC = () => {
  const selectedItem = useWorkerEvent("selectedItemUpdate");

  if (!selectedItem) return (
    <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.7)", fontStyle: "italic" }}>
      Click an entity to view its properties
    </div>
  )

  const [r, g, b, a] = selectedItem.color;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <Hexagon size={8} color={`rgba(${r}, ${g}, ${b}`} strokeColor="white" strokeWidth={0.5} />
        <h3 style={{ margin: 0 }}>{selectedItem.type.toUpperCase()}</h3>
      </div>
      {selectedItem.type === "Creature" && <SelectedItemCreature item={selectedItem} />}
      {/* <pre style={{ margin: 0 }}>
        {JSON.stringify(selectedItem, null, 2)}
      </pre> */}
    </div>
  );
};