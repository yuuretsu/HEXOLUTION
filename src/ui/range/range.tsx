import type { FC, ReactNode } from "react"
import styles from "./range.module.css";

export type RangeProps = {
  value: number;
  onChange: (value: number) => void;
  caption: ReactNode;
  min: number;
  max: number;
  step?: number;
}

export const Range: FC<RangeProps> = ({ caption, value, onChange, min, max, step }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.captionAndValue}>
        <div className={styles.caption}>{caption}</div>
        <div className={styles.value}>{value}</div>
      </div>
      <input className={styles.input} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  )
}
