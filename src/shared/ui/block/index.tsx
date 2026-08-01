import type { FC, PropsWithChildren, ReactNode } from "react";
import type { IconType } from "react-icons";
import { BlockTitle } from "./block-title";

export type BlockProps = PropsWithChildren<{
  title?: {
    Icon: IconType,
    text: string;
  }
}>;

export const Block: FC<BlockProps> = ({ title, children }) => (
  <div
    className="blur-bg"
    style={{
      padding: "16px 24px",
      borderRadius: 16,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      flexShrink: 0,
    }}
  >
    {title && <BlockTitle Icon={title.Icon}>{title.text}</BlockTitle>}
    {children}
  </div>
);
