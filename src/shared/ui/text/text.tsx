import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactElement,
  ReactNode,
} from "react";
import clsx from "clsx";
import styles from "./text.module.css";

export type TextSize = "sm";

type TextOwnProps<E extends ElementType> = {
  as?: E;
  size?: TextSize;
  isMuted?: boolean;
  isItalic?: boolean;
  isUppercase?: boolean;
  className?: string;
  children?: ReactNode;
};

export type TextProps<E extends ElementType = "span"> = TextOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof TextOwnProps<E>>;

export function Text<E extends ElementType = "span">({
  as,
  size,
  isMuted,
  isItalic,
  isUppercase,
  className,
  children,
  ...props
}: TextProps<E>): ReactElement {
  const Tag: ElementType = as || "span";

  return (
    <Tag
      className={clsx(
        size && styles[`size-${size}`],
        isMuted && styles.muted,
        isItalic && styles.italic,
        isUppercase && styles.uppercase,
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
