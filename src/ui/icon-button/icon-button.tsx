import type { FC } from "react";
import type { IconType } from "react-icons";
import styles from "./icon-button.module.css";

export const IconButton: FC<{
  onClick?: () => void,
  Icon: IconType,
}> = (({
  onClick,
  Icon
}) => {
  return (
    <button
      className={`blur-bg ${styles.button}`}
      disabled={!onClick}
      onClick={onClick}
    >
      <Icon size={"1.5rem"} style={{ display: "block" }} />
    </button>
  )
});