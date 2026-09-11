import { useState, useEffect } from "react";
import { Radio } from "@/shared/ui/radio";
import { Stack } from "@/shared/ui/stack";
import { Text } from "@/shared/ui/text";

export const ChangeControlMode: React.FC = () => {
  const [isTouchpadMode, setIsTouchpadMode] = useState(() => {
    const saved = localStorage.getItem("controlMode");
    return saved === "touchpad";
  });

  useEffect(() => {
    localStorage.setItem("controlMode", isTouchpadMode ? "touchpad" : "mouse");
  }, [isTouchpadMode]);

  const handleChange = (value: string) => {
    setIsTouchpadMode(value === "touchpad");
  };

  return (
    <Stack dir="column" gap={8}>
      <Radio
        options={[
          { text: "Mouse", value: "mouse" },
          { text: "Touchpad", value: "touchpad" }
        ]}
        value={isTouchpadMode ? "touchpad" : "mouse"}
        onChange={handleChange}
      />
      <Text size="sm" isMuted isItalic>
        {isTouchpadMode
          ? "Use two fingers to pan, pinch to zoom"
          : "Left click + drag to pan, wheel to zoom"
        }
      </Text>
    </Stack>
  );
};
