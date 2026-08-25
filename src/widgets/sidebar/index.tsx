import type { FC } from "react";
import clsx from "clsx";
import {
  HiAdjustmentsHorizontal,
  HiBeaker,
  HiCubeTransparent,
  HiFingerPrint,
} from "react-icons/hi2";
import { ChangeControlMode } from "@/features/change-control-mode";
import { ChangeSimulationSpeed } from "@/features/change-simulation-speed";
import { ChangeViewMode } from "@/features/change-view-mode";
import { Chart } from "@/shared/ui/chart";
import { Block } from "@/shared/ui/block";
import { SelectedEntity } from "@/entities/selected-entity";
import {
  CELL_COLORS,
  CELL_TYPE_NAMES,
  CellType,
} from "@/simulation/clans/cell-types";
import type { ChartData } from "@/shared/hooks/use-world-data";
import type { WorldData } from "@/shared/worker-protocol";
import styles from "./sidebar.module.css";

type SidebarProps = {
  data: WorldData;
  chartData: ChartData;
  isOpen: boolean;
};

const formatCompact = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10_000 ? 1 : 0,
  }).format(Math.round(value));

const TYPE_ORDER: CellType[] = [
  CellType.Apex,
  CellType.Leaf,
  CellType.Wood,
  CellType.Root,
  CellType.Antenna,
  CellType.Seed,
];

const rgb = (c: readonly [number, number, number, number]) =>
  `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

export const Sidebar: FC<SidebarProps> = ({ data, chartData, isOpen }) => {
  const counts = data.typeCounts ?? [];
  const living = data.livingCells || 1;

  return (
    <div
      className={clsx(styles.sidebar, {
        [styles.sidebarHidden]: !isOpen,
      })}
    >
      <Block title={{ Icon: HiAdjustmentsHorizontal, text: "Управление" }}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Шагов за кадр</span>
          <ChangeSimulationSpeed />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Режим вида</span>
          <ChangeViewMode />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Управление камерой</span>
          <ChangeControlMode />
        </label>
      </Block>

      <Block title={{ Icon: HiBeaker, text: "Почва" }}>
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Органика</span>
            <span className={styles.statValue}>{formatCompact(data.organicSoil)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Заряд</span>
            <span className={styles.statValue}>{formatCompact(data.energySoil)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Яд (орг.)</span>
            <span className={clsx(styles.statValue, styles.poisonOrganic)}>
              {formatCompact(data.organicPoison)}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Яд (заряд)</span>
            <span className={clsx(styles.statValue, styles.poisonEnergy)}>
              {formatCompact(data.energyPoison)}
            </span>
          </div>
        </div>
        <div className={styles.metaRow}>
          <span>Мутации</span>
          <span className={styles.metaValue}>{formatCompact(data.mutations)}</span>
        </div>
        <div className={styles.metaRow}>
          <span>Шаг мира</span>
          <span className={styles.metaValue}>{formatCompact(data.worldAge)}</span>
        </div>
      </Block>

      <Block title={{ Icon: HiCubeTransparent, text: "Клетки" }}>
        <div className={styles.typeList}>
          {TYPE_ORDER.map((type) => {
            const count = counts[type] ?? 0;
            const color = CELL_COLORS[type];
            return (
              <div key={type} className={styles.typeRow}>
                <span
                  className={styles.typeSwatch}
                  style={{ backgroundColor: rgb(color) }}
                />
                <span className={styles.typeName}>{CELL_TYPE_NAMES[type]}</span>
                <span className={styles.typeCount}>{formatCompact(count)}</span>
                <span className={styles.typePercent}>
                  {((count / living) * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
        <div className={styles.metaRow}>
          <span>Всего живых</span>
          <span className={styles.metaValue}>{formatCompact(data.livingCells)}</span>
        </div>
        <div className={styles.chartWrapper}>
          <Chart
            height={120}
            series={[
              {
                label: "живые",
                data: chartData.living,
                color: "rgb(180, 220, 255)",
              },
              {
                label: "листья",
                data: chartData.leaf,
                color: rgb(CELL_COLORS[CellType.Leaf]),
              },
              {
                label: "древесина",
                data: chartData.wood,
                color: "rgb(160, 140, 110)",
              },
              {
                label: "отростки",
                data: chartData.apex,
                color: rgb(CELL_COLORS[CellType.Apex]),
              },
            ]}
          />
        </div>
      </Block>

      <Block title={{ Icon: HiFingerPrint, text: "Клетка" }}>
        <SelectedEntity />
      </Block>
    </div>
  );
};
