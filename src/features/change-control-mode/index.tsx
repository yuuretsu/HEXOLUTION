import { Radio } from "@/shared/ui/radio";
import styles from "./change-control-mode.module.css";

export type ControlMode = "mouse" | "touchpad";

export const readControlMode = (): ControlMode =>
  localStorage.getItem("controlMode") === "touchpad" ? "touchpad" : "mouse";

export const persistControlMode = (mode: ControlMode) => {
  localStorage.setItem("controlMode", mode);
};

type ChangeControlModeProps = {
  value: ControlMode;
  onChange: (mode: ControlMode) => void;
};

export const ChangeControlMode: React.FC<ChangeControlModeProps> = ({
  value,
  onChange,
}) => {
  const isTouchpadMode = value === "touchpad";

  const handleChange = (next: string) => {
    const mode: ControlMode = next === "touchpad" ? "touchpad" : "mouse";
    persistControlMode(mode);
    onChange(mode);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.radioRow}>
        <Radio
          options={[
            { text: "Mouse", value: "mouse" },
            { text: "Touchpad", value: "touchpad" }
          ]}
          value={value}
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
