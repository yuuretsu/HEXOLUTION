import { type ElementType, type ComponentPropsWithoutRef, type ReactElement, type MouseEvent } from "react";
import type { IconType } from "react-icons";
import clsx from "clsx";
import { RippleLayer, useRipple } from "@/shared/ui/ripple";
import styles from "./icon-button.module.css";

interface IconButtonOwnProps<E extends ElementType> {
  as?: E;
  Icon: IconType;
  onClick?: () => void;
  className?: string;
}

type IconButtonProps<E extends ElementType> = IconButtonOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof IconButtonOwnProps<E>>;

export const IconButton = <E extends ElementType = "button",>({
  as,
  Icon,
  onClick,
  className,
  ...props
}: IconButtonProps<E>): ReactElement => {
  const Tag: ElementType = as || "button";
  const { ripples, spawnRipple, removeRipple } = useRipple();

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    spawnRipple(event);
    onClick?.();
  };

  return (
    <Tag
      className={clsx("blur-bg", styles.button, className)}
      {...(Tag === "button" ? { disabled: !onClick } : {})}
      {...props}
      onClick={handleClick}
    >
      <Icon size={"1.5rem"} className={styles.icon} />
      <RippleLayer ripples={ripples} onRemove={removeRipple} />
    </Tag>
  );
};
