import type { FC, PropsWithChildren, ReactNode } from "react";
import type { IconType } from "react-icons";
import { BlockTitle } from "./block-title";
import styles from "./block.module.css";

export type BlockProps = PropsWithChildren<{
  title?: {
    Icon: IconType,
    text: string;
  }
}>;

export const Block: FC<BlockProps> = ({ title, children }) => (
  <div className={`blur-bg ${styles.block}`}>
    {title && <BlockTitle Icon={title.Icon}>{title.text}</BlockTitle>}
    {children}
  </div>
);
