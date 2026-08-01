import type { FC } from "react";
import {
  HiAdjustmentsHorizontal,
  HiFingerPrint,
  HiSquaresPlus,
  HiSun,
} from "react-icons/hi2";
import { ChangeControlMode } from "components/change-control-mode";
import { ChangeSimulationSpeed } from "components/change-simulation-speed";
import { ChangeViewMode } from "components/change-view-mode";
import { SelectedItem } from "components/selected-item";
import { Chart } from "ui/chart";
import type { WorldData } from "simulation-worker-api";
import styles from "../app.module.css";
import type { ChartData } from "../hooks/use-world-data";
import { Block } from "./block";
import { BlockTitle } from "./block-title";
import { Entries } from "./entries";

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
      className={styles.sidebar}
      style={{
        transform: isOpen ? "" : "translate(70%, 80%) scale(0)",
        transitionDuration: "0.5s",
      }}
    >
      <Block>
        <BlockTitle Icon={HiAdjustmentsHorizontal}>Settings</BlockTitle>
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
          <ChangeControlMode />
        </div>
      </Block>
      <Block>
        <BlockTitle Icon={HiSun}>Energy</BlockTitle>
        <Entries
          entries={[
            ["World", data.worldEnergy],
            ["Entities", data.itemsEnergy],
          ]}
        />
      </Block>
      <Block>
        <BlockTitle Icon={HiSquaresPlus}>Entities</BlockTitle>
        <Entries entries={data.worldEntries} />
        <div
          style={{
            marginBottom: 0,
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>world age</div>
          <div style={{ fontVariantNumeric: "tabular-nums" }}>
            {fullAge}
            <span style={{ opacity: 0.5 }}>.{fractionalPart}</span>
          </div>
        </div>
      </Block>
      <Block>
        <BlockTitle Icon={HiFingerPrint}>Selected</BlockTitle>
        <SelectedItem />
      </Block>
    </div>
  );
};
