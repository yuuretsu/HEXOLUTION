import type { FC, PropsWithChildren } from "react";
import clsx from "clsx";
import styles from "./stack.module.css";

export type StackAlign = "start" | "center" | "end" | "stretch";

export type StackJustify =
  | "start"
  | "center"
  | "end"
  | "between"
  | "around"
  | "evenly";

export type StackProps = PropsWithChildren<{
  dir: "row" | "column";
  gap?: number;
  align?: StackAlign;
  justify?: StackJustify;
  isWrap?: boolean;
}>;

export const Stack: FC<StackProps> = ({
  dir,
  gap = 0,
  align,
  justify,
  isWrap,
  children,
}) => (
  <div
    className={clsx(
      styles.stack,
      styles[dir],
      align && styles[`align-${align}`],
      justify && styles[`justify-${justify}`],
      isWrap && styles.wrap,
    )}
    style={{ gap: `${gap}px` }}
  >
    {children}
  </div>
);
