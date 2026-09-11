import type { FC, PropsWithChildren } from "react";
import type { IconType } from "react-icons";
import { Stack } from "@/shared/ui/stack";
import styles from "./block-title.module.css";

const gradientId = "block-title-gradient";

export const BlockTitle: FC<PropsWithChildren<{ Icon?: IconType }>> = ({ Icon, children }) => (
  <Stack dir="row" gap={8} align="center">
    <svg width="0" height="0" className={styles.gradientSvg}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(200, 255, 200, 1)" />
          <stop offset="100%" stopColor="white" />
        </linearGradient>
      </defs>
    </svg>
    {Icon && <Icon size="1.5rem" className={styles.icon} />}
    <h3 className={styles.title}>
      {children}
    </h3>
  </Stack>
);
