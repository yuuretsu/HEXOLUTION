import { useState, useEffect } from "react";
import { Radio } from "ui/radio";
import { Range } from "ui/range";

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
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Radio
          options={[
            { text: "Mouse", value: "mouse" },
            { text: "Touchpad", value: "touchpad" }
          ]}
          value={isTouchpadMode ? "touchpad" : "mouse"}
          onChange={handleChange}
        />
      </div>
      <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.7)", fontStyle: "italic" }}>
        {isTouchpadMode
          ? "Use two fingers to pan, pinch to zoom"
          : "Left click + drag to pan, wheel to zoom"
        }
      </div>
    </div>
  );
};
