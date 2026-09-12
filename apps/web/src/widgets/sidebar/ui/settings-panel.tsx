import type { FC } from "react";
import { HiAdjustmentsHorizontal } from "react-icons/hi2";
import { ChangeControlMode } from "@/features/change-control-mode";
import { ChangeSimulationSpeed } from "@/features/change-simulation-speed";
import { ChangeViewMode } from "@/features/change-view-mode";
import { Panel } from "@/shared/ui/panel";
import { Stack } from "@/shared/ui/stack";
import { Text } from "@/shared/ui/text";

export const SettingsPanel: FC = () => (
  <Panel title={{ Icon: HiAdjustmentsHorizontal, text: "Settings" }}>
    <Stack dir="column" gap={4}>
      <Text>SIMULATION STEPS PER FRAME</Text>
      <ChangeSimulationSpeed />
    </Stack>
    <Stack dir="column" gap={4}>
      <Text>VIEW MODE</Text>
      <ChangeViewMode />
    </Stack>
    <Stack dir="column" gap={4}>
      <Text>CONTROL MODE</Text>
      <ChangeControlMode />
    </Stack>
  </Panel>
);
