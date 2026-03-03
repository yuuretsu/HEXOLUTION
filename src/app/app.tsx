import { WorldImage } from "components/world-image";
import { useEffect, useState, type FC, type PropsWithChildren } from "react";
import { workerApi, type ApiEvents, type WorldData } from "simulation-worker-api";
import styles from "./app.module.css";
import { ChangeSimulationSpeed } from "components/change-simulation-speed";
import { ChangeViewMode } from "components/change-view-mode";
import { ChangeControlMode } from "components/change-control-mode";
import { PlayPause } from "components/play-pause";
import { useWorkerEvent } from "use-worker-event";
import { SelectedItem } from "components/selected-item";
import { Chart } from "ui/chart";
import { HiAdjustmentsHorizontal, HiFingerPrint, HiSquaresPlus, HiSun, HiCog6Tooth } from "react-icons/hi2";
import { SiGithub } from "react-icons/si"
import type { IconType } from "react-icons";
import { IconButton } from "ui/icon-button";

type ChartData<Fields extends string> = { [Field in Fields]: [number, number][] };

type ChartDataApp = ChartData<"creatures" | "food">;

const useWorldData = () => {
  const [data, setData] = useState<WorldData>({ worldEnergy: 0, itemsEnergy: 0, worldEntries: [], worldAge: 0 });
  const [chartData, setChartData] = useState<ChartDataApp>({ creatures: [], food: [] });

  const addChartData = (name: keyof ChartDataApp, value: [number, number]) => {
    setChartData((prev) => {
      const newData = [...prev[name], value];
      return {
        ...prev,
        [name]: newData.slice(-1000),
      };
    });
  };
  useEffect(() => {
    const unsubscribe = workerApi.on("data", data => {
      setData(data);
      addChartData("creatures", [data.worldAge, data.worldEntries.find(([name]) => name === "Creature")![1]]);
      addChartData("food", [data.worldAge, data.worldEntries.find(([name]) => name === "Food")![1]]);
    });

    return unsubscribe;
  }, []);

  return [data, chartData] as const;
};

const BlockTitle: FC<PropsWithChildren<{ Icon?: IconType }>> = ({
  Icon,
  children
}) => {
  const gradientId = "block-title-gradient";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(200, 255, 200, 1)" />
            <stop offset="100%" stopColor="white" />
          </linearGradient>
        </defs>
      </svg>

      {Icon && (
        <Icon
          size="1.5rem"
          style={{
            fill: `url(#${gradientId})`,
          }}
        />
      )}

      <h3
        style={{
          fontFamily: '"BBH Bartle", sans-serif',
          margin: 0,
          fontSize: "1.5rem",
          fontWeight: "bold",
          background: "linear-gradient(to bottom, rgba(200, 255, 200), white)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        }}
      >
        {children}
      </h3>
    </div>
  );
};

const Block: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div
      className="blur-bg"
      style={{
        padding: "16px 24px",
        borderRadius: 16,
        overflow: 'hidden',
        display: "flex",
        flexDirection: "column",
        gap: 16,
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  )
};

export const App: FC = () => {
  const [data, chartData] = useWorldData();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <WorldImage
        onClickPixel={async (x, y) => workerApi.call("selectItem", [x, y])}
        isTouchpadMode={localStorage.getItem("controlMode") === "touchpad"}
      />
      <div
        className={styles.sidebar}
        style={{
          transform: isOpen ? "" : "translate(70%, 80%) scale(0)",
          transitionDuration: "0.5s",
        }}
      >
        <Block>
          <BlockTitle Icon={HiAdjustmentsHorizontal}>
            Settings
          </BlockTitle>
          <ChangeSimulationSpeed />
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
          <BlockTitle Icon={HiSun}>
            Energy
          </BlockTitle>
          <Entries
            entries={[
              ["world", data.worldEnergy],
              ["entities", data.itemsEnergy],
            ]}
          />
        </Block>
        <Block>
          <BlockTitle Icon={HiSquaresPlus}>
            Entities
          </BlockTitle>
          <Entries entries={data.worldEntries} />
          <div style={{ position: "relative" }}>
            <div style={{ marginBottom: 0, borderRadius: 8, overflow: "hidden", backgroundColor: "rgba(255, 255, 255, 0.1)" }}>
              <Chart
                height={128}
                series={[
                  { label: "creatures", points: chartData.creatures, color: "rgb(100, 255, 200)" },
                  { label: "food", points: chartData.food, color: "rgb(255, 255, 150)" }
                ]}
              />
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 4, left: 4,
                display: "flex",
                gap: 8,
                textTransform: "uppercase",
                fontSize: 16 * 0.75
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 2, backgroundColor: "rgb(100, 255, 200)" }} />
                creatures
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 2, backgroundColor: "rgb(255, 255, 150)" }} />
                food
              </div>
            </div>
          </div>
          <div>world age: {data.worldAge}</div>
        </Block>
        <Block>
          <BlockTitle Icon={HiFingerPrint}>
            Selected
          </BlockTitle>
          <SelectedItem />
        </Block>
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          height: 48,
          display: "flex",
          gap: 8,
        }}
      >
        <IconButton as="a" href="https://github.com/yuuretsu/HEXOLUTION" target="_blank" Icon={SiGithub} />
        <PlayPause />
        <IconButton onClick={() => setIsOpen(!isOpen)} Icon={HiCog6Tooth} />
      </div>
    </>
  );
};


const Entries: FC<{ entries: [string, number][] }> = ({ entries }) => {
  const all = entries.reduce((a, b) => a + b[1], 0);
  return (
    <table>
      <tbody>
        {entries.map(([name, count]) => {
          return (
            <tr key={name}>
              <th style={{ minWidth: 150 }}>{name.replace(/([A-Z])/g, ' $1').toUpperCase()}</th>
              <td style={{ minWidth: 100 }}>{new Intl.NumberFormat("en-US").format(count)}</td>
              <td style={{ minWidth: 64 }}>{(count / all * 100).toFixed(1)}%</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  );
};