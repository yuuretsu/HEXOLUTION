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
import { Block } from "@/shared/ui/block";
import { Entries } from "@/shared/ui/entries";
import { SelectedEntity } from "@/entities/selected-entity";
import { Stack } from "@/shared/ui/stack";

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
        <Block title={{ Icon: HiAdjustmentsHorizontal, text: "Settings" }}>
          <Stack dir="column" gap={4}>
            <div>SIMULATION STEPS PER FRAME</div>
            <ChangeSimulationSpeed />
          </Stack>
          <Stack dir="column" gap={4}>
            <div>VIEW MODE</div>
            <ChangeViewMode />
          </Stack>
          <Stack dir="column" gap={4}>
            <div>CONTROL MODE</div>
            <ChangeControlMode />
          </Stack>
        </Block>
        <Block title={{ Icon: HiSun, text: "Energy" }}>
          <Entries
            entries={[
              ["World", data.worldEnergy],
              ["Creature", data.creaturesEnergy],
              ["Food", data.foodEnergy],
            ]}
          />
        </Block>
        <Block title={{ Icon: HiSquaresPlus, text: "Entities" }}>
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
                  label: "food",
                  data: chartData.food,
                  color: "rgb(255, 255, 150)",
                },
              ]}
            />
          </div>
          <Stack dir="row" gap={0} align="center" justify="between">
            <div>world age</div>
            <div className={styles.worldAgeValue}>
              {fullAge}
              <span className={styles.worldAgeFraction}>.{fractionalPart}</span>
            </div>
          </Stack>
        </Block>
        <Block title={{ Icon: HiFingerPrint, text: "Selected" }}>
          <SelectedEntity />
        </Block>
      </Stack>
    </div>
  );
};
