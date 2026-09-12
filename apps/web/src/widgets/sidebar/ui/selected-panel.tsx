import type { FC } from "react";
import { HiFingerPrint } from "react-icons/hi2";
import { SelectedEntity } from "@/entities/selected-entity";
import { Panel } from "@/shared/ui/panel";

export const SelectedPanel: FC = () => (
  <Panel title={{ Icon: HiFingerPrint, text: "Selected" }}>
    <SelectedEntity />
  </Panel>
);
