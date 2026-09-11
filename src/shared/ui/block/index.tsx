import type { FC, PropsWithChildren } from "react";
import type { IconType } from "react-icons";
import clsx from "clsx";
import { Stack } from "@/shared/ui/stack";
import { BlockTitle } from "./block-title";
import styles from "./block.module.css";

export type BlockProps = PropsWithChildren<{
  title?: {
    Icon: IconType,
    text: string;
  }
}>;

export const Block: FC<BlockProps> = ({ title, children }) => (
  <div className={clsx("blur-bg", styles.block)}>
    <Stack dir="column" gap={16}>
      {title && <BlockTitle Icon={title.Icon}>{title.text}</BlockTitle>}
      {children}
    </Stack>
  </div>
);
