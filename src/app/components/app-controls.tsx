import type { FC } from "react";
import { HiCog6Tooth } from "react-icons/hi2";
import { SiGithub } from "react-icons/si";
import { PlayPause } from "components/play-pause";
import { IconButton } from "ui/icon-button";

type AppControlsProps = {
  onToggleSidebar: () => void;
};

export const AppControls: FC<AppControlsProps> = ({ onToggleSidebar }) => (
  <div
    style={{
      position: "fixed",
      bottom: 16,
      right: 16,
      height: 48,
      display: "flex",
      gap: 8,
    }}
  >
    <IconButton as="a" href="https://github.com/yuuretsu/HEXOLUTION" target="_blank" Icon={SiGithub} />
    <PlayPause />
    <IconButton onClick={onToggleSidebar} Icon={HiCog6Tooth} />
  </div>
);
