import {
  type ElementType,
  type ReactElement,
  type MouseEvent,
} from "react";
import type { IconType } from "react-icons";
import { clsx } from "clsx";
import type { PolymorphicProps } from "@/shared/lib/polymorphic";
import commonStyles from "@/shared/styles/common.module.css";
import { RippleLayer, useRipple } from "@/shared/ui/ripple";
import styles from "./icon-button.module.css";

type IconButtonOwnProps = {
  Icon: IconType;
  onClick?: () => void;
  className?: string;
};

type IconButtonProps<E extends ElementType = "button"> = PolymorphicProps<
  E,
  IconButtonOwnProps
>;

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
      className={clsx(commonStyles.blurBg, styles.button, className)}
      {...(Tag === "button" ? { disabled: !onClick } : {})}
      {...props}
      onClick={handleClick}
    >
      <Icon size={"1.5rem"} className={styles.icon} />
      <RippleLayer ripples={ripples} onRemove={removeRipple} />
    </Tag>
  );
};
