import { useState, type MouseEvent } from "react";

export interface RippleState {
  id: number;
  x: number;
  y: number;
  size: number;
}

export const useRipple = () => {
  const [ripples, setRipples] = useState<RippleState[]>([]);

  const spawnRipple = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;

    setRipples((prev) => [
      ...prev,
      {
        id: event.timeStamp,
        x: event.clientX - rect.left - size / 2,
        y: event.clientY - rect.top - size / 2,
        size,
      },
    ]);
  };

  const removeRipple = (id: number) => {
    setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
  };

  return { ripples, spawnRipple, removeRipple };
};
