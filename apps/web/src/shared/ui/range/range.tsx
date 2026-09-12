import type { FC, ReactNode } from "react"
import { Stack } from "@/shared/ui/stack";
import { Text } from "@/shared/ui/text";
import styles from "./range.module.css";

export type RangeProps = {
  value: number;
  onChange: (value: number) => void;
  caption: ReactNode;
  min: number;
  max: number;
  step?: number;
  valueDisplay?: ReactNode;
}

export const Range: FC<RangeProps> = ({ caption, value, onChange, min, max, step, valueDisplay }) => {
  return (
    <div className={styles.wrapper}>
      <Stack dir="row" gap={8} justify="between">
        <Text>{caption}</Text>
        <Text className={styles.value}>{valueDisplay ?? value}</Text>
      </Stack>
      <input className={styles.input} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  )
}
