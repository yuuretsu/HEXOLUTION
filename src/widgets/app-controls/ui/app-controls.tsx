import type { FC } from "react";
import { HiCog6Tooth } from "react-icons/hi2";
import { SiGithub } from "react-icons/si";
import { IconButton } from "@/shared/ui/icon-button";
import { Stack } from "@/shared/ui/stack";
import styles from "./app-controls.module.css";
import { TogglePlayPause } from "@/features/change-simulation-speed";

type AppControlsProps = {
  onToggleSidebar: () => void;
};

export const AppControls: FC<AppControlsProps> = ({ onToggleSidebar }) => (
  <div className={styles.appControls}>
    <Stack dir="row" gap={8}>
      <IconButton as="a" href="https://github.com/yuuretsu/HEXOLUTION" target="_blank" Icon={SiGithub} />
      <TogglePlayPause />
      <IconButton onClick={onToggleSidebar} Icon={HiCog6Tooth} />
    </Stack>
  </div>
);
