import { useState, useEffect } from "react";
import { Radio } from "@/shared/ui/radio";
import styles from "./change-control-mode.module.css";

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
    <div className={styles.wrapper}>
      <div className={styles.radioRow}>
        <Radio
          options={[
            { text: "Mouse", value: "mouse" },
            { text: "Touchpad", value: "touchpad" }
          ]}
          value={isTouchpadMode ? "touchpad" : "mouse"}
          onChange={handleChange}
        />
      </div>
      <div className={styles.hint}>
        {isTouchpadMode
          ? "Use two fingers to pan, pinch to zoom"
          : "Left click + drag to pan, wheel to zoom"
        }
      </div>
    </div>
  );
};