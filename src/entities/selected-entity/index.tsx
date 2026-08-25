import { CELL_COLORS, CELL_TYPE_NAMES, CellType } from "@/simulation/clans/cell-types";
import type { SelectedItemData } from "@/shared/worker-protocol";
import type { FC } from "react";
import { useWorkerEvent } from "@/shared/hooks/use-worker-event";
import styles from "./selected-entity.module.css";

const DIR_LABELS = ["→", "↘", "↙", "←", "↖", "↗"] as const;
const GROW_DIRS = [
  { label: "влево", offset: 0 },
  { label: "вперёд", offset: 1 },
  { label: "вправо", offset: 2 },
] as const;

const decodeGrowth = (value: number): string => {
  if (value <= 63) return `отросток → ген ${value % 32}`;
  if (value <= 75) return "лист";
  if (value <= 85) return "антена";
  if (value <= 95) return "корень";
  return "—";
};

const ClanCellDetails: FC<{ item: SelectedItemData }> = ({ item }) => {
  const gene = item.geneBytes ?? [];
  const alone = item.parent === -1;

  return (
    <div className={styles.details}>
      <dl className={styles.stats}>
        <div>
          <dt>Энергия</dt>
          <dd>{item.energy}</dd>
        </div>
        <div>
          <dt>Возраст</dt>
          <dd>{item.age}</dd>
        </div>
        <div>
          <dt>Уровень</dt>
          <dd>{item.level}</dd>
        </div>
        <div>
          <dt>Клан</dt>
          <dd>#{item.clanId}</dd>
        </div>
        <div>
          <dt>Геном</dt>
          <dd>#{item.genomeIndex}</dd>
        </div>
        <div>
          <dt>Акт. ген</dt>
          <dd>#{item.activeGene}</dd>
        </div>
        <div>
          <dt>Связь</dt>
          <dd>{alone ? "одиночка" : `к родителю ${DIR_LABELS[item.parent ?? 0] ?? item.parent}`}</dd>
        </div>
        <div>
          <dt>Направление</dt>
          <dd>{DIR_LABELS[item.direction ?? 0] ?? item.direction}</dd>
        </div>
        <div>
          <dt>Органика тут</dt>
          <dd>{Math.round(item.organicHere ?? 0)}</dd>
        </div>
        <div>
          <dt>Заряд тут</dt>
          <dd>{Math.round(item.energyHere ?? 0)}</dd>
        </div>
      </dl>

      {gene.length >= 3 && (
        <div className={styles.geneBlock}>
          <div className={styles.geneTitle}>Рост активного гена</div>
          <div className={styles.growthList}>
            {GROW_DIRS.map(({ label, offset }) => (
              <div key={label} className={styles.growthRow}>
                <span className={styles.growthDir}>{label}</span>
                <span className={styles.growthValue}>{decodeGrowth(gene[offset]!)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {gene.length >= 21 && (
        <div className={styles.geneBlock}>
          <div className={styles.geneTitle}>Байты гена #{item.activeGene}</div>
          <div className={styles.byteGrid}>
            {gene.map((byte, i) => (
              <span key={i} className={styles.byte} title={`+${i}`}>
                {byte}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const SelectedEntity: FC = () => {
  const selectedItem = useWorkerEvent("selectedItemUpdate");

  if (!selectedItem) {
    return (
      <div className={styles.emptyHint}>
        Кликните по клетке на карте
      </div>
    );
  }

  const [r, g, b] = selectedItem.color;
  const cellType = selectedItem.cellType as CellType | undefined;
  const title =
    cellType !== undefined
      ? CELL_TYPE_NAMES[cellType]
      : selectedItem.type;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span
          className={styles.swatch}
          style={{
            backgroundColor:
              cellType !== undefined
                ? `rgb(${CELL_COLORS[cellType][0]}, ${CELL_COLORS[cellType][1]}, ${CELL_COLORS[cellType][2]})`
                : `rgb(${r}, ${g}, ${b})`,
          }}
        />
        <div className={styles.headerText}>
          <h3 className={styles.title}>{title}</h3>
          {cellType !== undefined && (
            <span className={styles.subtitle}>клетка организма</span>
          )}
        </div>
      </div>
      {cellType !== undefined && <ClanCellDetails item={selectedItem} />}
    </div>
  );
};
