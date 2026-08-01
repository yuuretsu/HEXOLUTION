import type { FC, PropsWithChildren } from "react";
import type { IconType } from "react-icons";

const gradientId = "block-title-gradient";

export const BlockTitle: FC<PropsWithChildren<{ Icon?: IconType }>> = ({ Icon, children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(200, 255, 200, 1)" />
          <stop offset="100%" stopColor="white" />
        </linearGradient>
      </defs>
    </svg>
    {Icon && <Icon size="1.5rem" style={{ fill: `url(#${gradientId})` }} />}
    <h3
      style={{
        fontFamily: '"BBH Bartle", sans-serif',
        margin: 0,
        fontSize: "1.5rem",
        fontWeight: "bold",
        background: "linear-gradient(to bottom, rgba(200, 255, 200), white)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
      }}
    >
      {children}
    </h3>
  </div>
);
