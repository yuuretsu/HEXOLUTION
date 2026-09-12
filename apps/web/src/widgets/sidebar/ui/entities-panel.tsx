import type { FC } from "react";
import { HiSquaresPlus } from "react-icons/hi2";
import { useWorldData } from "@/shared/lib/world-data";

import { Chart } from "@/shared/ui/chart";
import { Entries } from "@/shared/ui/entries";
import { Panel } from "@/shared/ui/panel";
import { Stack } from "@/shared/ui/stack";
import { Text } from "@/shared/ui/text";
import styles from "./entities-panel.module.css";

export const EntitiesPanel: FC = () => {
  const { data, chartData } = useWorldData();
  const worldAgeDivider = data.worldSize.width * data.worldSize.height || 1;
  const fullAge = Math.floor(data.worldAge / worldAgeDivider);
  const fractionalPart = (data.worldAge % worldAgeDivider)
    .toString()
    .padStart(3, "0")
    .slice(0, 3);

  return (
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
  );
};
