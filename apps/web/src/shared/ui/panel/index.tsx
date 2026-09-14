import type { FC, PropsWithChildren } from "react";
import type { IconType } from "react-icons";
import { clsx } from "clsx";
import commonStyles from "@/shared/styles/common.module.css";
import { Stack } from "@/shared/ui/stack";
import { PanelTitle } from "./panel-title";
import styles from "./panel.module.css";

export type PanelProps = PropsWithChildren<{
  title?: {
    Icon: IconType,
    text: string;
  }
}>;

export const Panel: FC<PanelProps> = ({ title, children }) => (
  <div className={clsx(commonStyles.blurBg, styles.panel)}>
    <Stack dir="column" gap={16}>
      {title && <PanelTitle Icon={title.Icon}>{title.text}</PanelTitle>}
      {children}
    </Stack>
  </div>
);
