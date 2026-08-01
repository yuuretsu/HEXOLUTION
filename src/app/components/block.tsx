import type { FC, PropsWithChildren } from "react";

export const Block: FC<PropsWithChildren> = ({ children }) => (
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
    {children}
  </div>
);
