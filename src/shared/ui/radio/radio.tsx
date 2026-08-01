import type { FC, PropsWithChildren } from "react";
import clsx from "clsx";
import styles from "./radio.module.css";

export type RadioItemProps = PropsWithChildren & {
  isActive?: boolean;
  onClick?: () => void;
};

const RadioItem: FC<RadioItemProps> = ({ isActive, onClick, children }) => {
  return (
    <label
      className={clsx(styles.item, isActive ? styles.itemActive : styles.itemInactive)}
      onClick={onClick}
    >
      <input type="radio" name="" id="" className={styles.input} />
      <span>{children}</span>
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
    <div className={styles.wrapper}>
      {options.map((option, i) => (
        <RadioItem key={i} isActive={option.value === value} onClick={() => onChange(option.value)}>
          {option.text}
        </RadioItem>
      ))}
    </div>
  );
};