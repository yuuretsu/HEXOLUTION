import type { FC } from "react";
import clsx from "clsx";
import {
  HiAdjustmentsHorizontal,
  HiFingerPrint,
  HiSquaresPlus,
  HiSun,
} from "react-icons/hi2";
import { ChangeControlMode, type ControlMode } from "@/features/change-control-mode";
import { ChangeSimulationSpeed } from "@/features/change-simulation-speed";
import { ChangeViewMode } from "@/features/change-view-mode";
import { Chart } from "@/shared/ui/chart";
import styles from "./sidebar.module.css";
import type { ChartData } from "@/shared/hooks/use-world-data";
import type { WorldData } from "@/shared/worker-protocol";
import { Block } from "@/shared/ui/block";
import { Entries } from "@/shared/ui/entries";
import { SelectedEntity } from "@/entities/selected-entity";

type SidebarProps = {
  data: WorldData;
  chartData: ChartData;
  isOpen: boolean;
  controlMode: ControlMode;
  onControlModeChange: (mode: ControlMode) => void;
};

export const Sidebar: FC<SidebarProps> = ({
  data,
  chartData,
  isOpen,
  controlMode,
  onControlModeChange,
}) => {
  const worldAgeDivider = data.worldSize.width * data.worldSize.height || 1;
  const fullAge = Math.floor(data.worldAge / worldAgeDivider);
  const remainder = data.worldAge % worldAgeDivider;
  const fractionalPart = Math.floor((remainder * 1000) / worldAgeDivider)
    .toString()
    .padStart(3, "0");

  return (
    <div
      className={clsx(styles.sidebar, {
        [styles.sidebarHidden]: !isOpen,
      })}
    >
      <Block title={{ Icon: HiAdjustmentsHorizontal, text: "Settings" }}>
        <div>
          <div>SIMULATION STEPS PER FRAME</div>
          <ChangeSimulationSpeed />
        </div>
        <div>
          <div>VIEW MODE</div>
          <ChangeViewMode />
        </div>
        <div>
          <div>CONTROL MODE</div>
          <ChangeControlMode value={controlMode} onChange={onControlModeChange} />
        </div>
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
        <div className={styles.worldAgeRow}>
          <div>world age</div>
          <div className={styles.worldAgeValue}>
            {fullAge}
            <span className={styles.worldAgeFraction}>.{fractionalPart}</span>
          </div>
        </div>
      </Block>
      <Block title={{ Icon: HiFingerPrint, text: "Selected" }}>
        <SelectedEntity />
      </Block>
    </div>
  );
};