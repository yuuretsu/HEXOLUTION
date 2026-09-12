import type { FC } from "react";
import { useWorkerEvent } from "@/shared/hooks/use-worker-event";
import { Stack } from "@/shared/ui/stack";
import { Text } from "@/shared/ui/text";
import { WorldEntityCreature } from "./ui/world-entity-creature";
import styles from "./selected-entity.module.css";

export const SelectedEntity: FC = () => {
  const selectedItem = useWorkerEvent("selection");

  if (!selectedItem) {
    return (
      <Text size="sm" isMuted isItalic>
        Click an entity to view its properties
      </Text>
    );
  }

  const [r, g, b] = selectedItem.color;

  return (
    <Stack dir="column" gap={16}>
      <Stack dir="row" gap={6} align="center">
        <div
          className={styles.entitySwatch}
          style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
        />
        <Text as="h3" isUppercase className={styles.selectedTitle}>
          {selectedItem.type}
        </Text>
      </Stack>
      {selectedItem.type === "Creature" && (
        <WorldEntityCreature item={selectedItem} />
      )}
    </Stack>
  );
};
