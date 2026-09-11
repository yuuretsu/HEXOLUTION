import type { FC } from "react";
import { HiSun } from "react-icons/hi2";
import { useWorldData } from "@/shared/hooks/use-world-data";
import { Panel } from "@/shared/ui/panel";
import { Entries } from "@/shared/ui/entries";

export const EnergyPanel: FC = () => {
  const { data } = useWorldData();

  return (
    <Panel title={{ Icon: HiSun, text: "Energy" }}>
      <Entries
        entries={[
          ["World", data.worldEnergy],
          ["Creature", data.creaturesEnergy],
          ["Organic", data.organicEnergy],
        ]}
      />
    </Panel>
  );
};
