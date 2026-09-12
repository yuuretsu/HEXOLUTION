import type { FC, MouseEvent, PropsWithChildren } from "react";
import { clsx } from "clsx";
import { Stack } from "@/shared/ui/stack";
import { Text } from "@/shared/ui/text";
import { RippleLayer, useRipple } from "@/shared/ui/ripple";
import styles from "./radio.module.css";

export type RadioItemProps = PropsWithChildren & {
  isActive?: boolean;
  onClick?: () => void;
};

const RadioItem: FC<RadioItemProps> = ({ isActive, onClick, children }) => {
  const { ripples, spawnRipple, removeRipple } = useRipple();

  const handleClick = (event: MouseEvent<HTMLLabelElement>) => {
    spawnRipple(event);
    onClick?.();
  };

  return (
    <label
      className={clsx(styles.item, isActive ? styles.itemActive : styles.itemInactive)}
      onClick={handleClick}
    >
      <input type="radio" name="" id="" className={styles.input} />
      <Text className={styles.label}>{children}</Text>
      <RippleLayer ripples={ripples} onRemove={removeRipple} />
    </label>
  );
};

export type RadioProps<T = string> = {
  options: { text: string, value: T }[];
  value: T;
  onChange: (value: T) => void;
}

export const Radio = <T,>({ options, value, onChange }: RadioProps<T>) => {
  return (
    <Stack dir="row" gap={4} isWrap>
      {options.map((option, i) => (
        <RadioItem key={i} isActive={option.value === value} onClick={() => onChange(option.value)}>
          {option.text}
        </RadioItem>
      ))}
    </Stack>
  );
};
