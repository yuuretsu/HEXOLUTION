import type { ReactNode } from "react";
import type { RippleState } from "./use-ripple";
import styles from "./ripple.module.css";

export const RippleLayer = ({
  ripples,
  onRemove,
}: {
  ripples: RippleState[];
  onRemove: (id: number) => void;
}): ReactNode => {
  return ripples.map((ripple) => (
    <span
      key={ripple.id}
      className={styles.ripple}
      style={{
        width: ripple.size,
        height: ripple.size,
        left: ripple.x,
        top: ripple.y,
      }}
      onAnimationEnd={() => onRemove(ripple.id)}
    />
  ));
};
