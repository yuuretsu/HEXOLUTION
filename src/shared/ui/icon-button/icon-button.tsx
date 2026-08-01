import type { ElementType, ComponentPropsWithoutRef, ReactElement } from "react";
import type { IconType } from "react-icons";
import styles from "./icon-button.module.css";

interface IconButtonOwnProps<E extends ElementType> {
  as?: E;
  Icon: IconType;
  onClick?: () => void;
  className?: string;
}

type IconButtonProps<E extends ElementType> = IconButtonOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof IconButtonOwnProps<E>>;

export function IconButton<E extends ElementType = "button">({
  as,
  Icon,
  onClick,
  className,
  ...props
}: IconButtonProps<E>): ReactElement {
  const Tag = (as || "button") as ElementType;

  return (
    <Tag
      className={`blur-bg ${styles.button} ${className || ""}`}
      onClick={onClick}
      {...(Tag === "button" ? { disabled: !onClick } : {})}
      {...props}
    >
      <Icon size={"1.5rem"} style={{ display: "block" }} />
    </Tag>
  );
}