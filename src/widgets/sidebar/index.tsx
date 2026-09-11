import type { FC } from "react";
import clsx from "clsx";
import {
  HiAdjustmentsHorizontal,
  HiFingerPrint,
  HiSquaresPlus,
  HiSun,
} from "react-icons/hi2";
import { ChangeControlMode } from "@/features/change-control-mode";
import { ChangeSimulationSpeed } from "@/features/change-simulation-speed";
import { ChangeViewMode } from "@/features/change-view-mode";
import { Chart } from "@/shared/ui/chart";
import styles from "./sidebar.module.css";
import type { ChartData } from "@/shared/hooks/use-world-data";
import type { WorldData } from "@/shared/worker-protocol";
import { Panel } from "@/shared/ui/panel";
import { Entries } from "@/shared/ui/entries";
import { SelectedEntity } from "@/entities/selected-entity";
import { Stack } from "@/shared/ui/stack";
import { Text } from "@/shared/ui/text";

type SidebarProps = {
  data: WorldData;
  chartData: ChartData;
  isOpen: boolean;
};

export const Sidebar: FC<SidebarProps> = ({ data, chartData, isOpen }) => {
  const worldAgeDivider = data.worldSize.width * data.worldSize.height || 1;
  const fullAge = Math.floor(data.worldAge / worldAgeDivider);
  const fractionalPart = (data.worldAge % worldAgeDivider)
    .toString()
    .padStart(3, "0")
    .slice(0, 3);

  return (
    <div
      className={clsx(styles.sidebar, {
        [styles.sidebarHidden]: !isOpen,
      })}
    >
      <Stack dir="column" gap={16}>
        <Panel title={{ Icon: HiAdjustmentsHorizontal, text: "Settings" }}>
          <Stack dir="column" gap={4}>
            <Text>SIMULATION STEPS PER FRAME</Text>
            <ChangeSimulationSpeed />
          </Stack>
          <Stack dir="column" gap={4}>
            <Text>VIEW MODE</Text>
            <ChangeViewMode />
          </Stack>
          <Stack dir="column" gap={4}>
            <Text>CONTROL MODE</Text>
            <ChangeControlMode />
          </Stack>
        </Panel>
        <Panel title={{ Icon: HiSun, text: "Energy" }}>
          <Entries
            entries={[
              ["World", data.worldEnergy],
              ["Creature", data.creaturesEnergy],
              ["Organic", data.organicEnergy],
            ]}
          />
        </Panel>
        <Panel title={{ Icon: HiSquaresPlus, text: "Entities" }}>
          <Entries entries={data.worldEntries} />
          <div className={styles.chartWrapper}>
            <Chart
              height={128}
              series={[
                {
                  label: "creatures",
                  data: chartData.creatures,
                  color: "rgb(100, 255, 200)",
                },
                {
                  label: "organic",
                  data: chartData.organic,
                  color: "rgb(255, 255, 150)",
                },
              ]}
            />
          </div>
          <Stack dir="row" align="center" justify="between">
            <Text>world age</Text>
            <Text className={styles.worldAgeValue}>
              {fullAge}
              <Text className={styles.worldAgeFraction}>.{fractionalPart}</Text>
            </Text>
          </Stack>
        </Panel>
        <Panel title={{ Icon: HiFingerPrint, text: "Selected" }}>
          <SelectedEntity />
        </Panel>
      </Stack>
    </div>
  );
};
