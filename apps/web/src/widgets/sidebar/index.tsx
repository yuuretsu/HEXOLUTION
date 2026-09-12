import type { FC } from "react";
import clsx from "clsx";
import { Stack } from "@/shared/ui/stack";
import styles from "./sidebar.module.css";
import { EnergyPanel } from "./ui/energy-panel";
import { EntitiesPanel } from "./ui/entities-panel";
import { SelectedPanel } from "./ui/selected-panel";
import { SettingsPanel } from "./ui/settings-panel";

type SidebarProps = {
  isOpen: boolean;
};

export const Sidebar: FC<SidebarProps> = ({ isOpen }) => (
  <div
    className={clsx(styles.sidebar, {
      [styles.sidebarHidden]: !isOpen,
    })}
  >
    <Stack dir="column" gap={16}>
      <SettingsPanel />
      <EnergyPanel />
      <EntitiesPanel />
      <SelectedPanel />
    </Stack>
  </div>
);
