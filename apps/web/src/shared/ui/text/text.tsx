import type { ElementType, ReactElement, ReactNode } from "react";
import { clsx } from "clsx";
import type { PolymorphicProps } from "@/shared/lib/polymorphic";
import styles from "./text.module.css";

export type TextSize = "sm";

type TextOwnProps = {
  size?: TextSize;
  isMuted?: boolean;
  isItalic?: boolean;
  isUppercase?: boolean;
  className?: string;
  children?: ReactNode;
};

export type TextProps<E extends ElementType = "span"> = PolymorphicProps<
  E,
  TextOwnProps
>;

export const Text = <E extends ElementType = "span",>({
  as,
  size,
  isMuted,
  isItalic,
  isUppercase,
  className,
  children,
  ...props
}: TextProps<E>): ReactElement => {
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
};
