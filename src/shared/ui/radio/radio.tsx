import type { FC, PropsWithChildren } from "react";

export type RadioItemProps = PropsWithChildren & {
  isActive?: boolean;
  onClick?: () => void;
};

const RadioItem: FC<RadioItemProps> = ({ isActive, onClick, children }) => {
  return (
    <label
      style={{
        padding: "0px 4px",
        backgroundColor: isActive ? "rgba(150, 255, 150, 0.5)" : "rgba(255, 255, 255, 0.25)",
        borderRadius: 4,
        cursor: "pointer"
      }}
      onClick={onClick}
    >
      <input type="radio" name="" id="" style={{ all: "unset" }} />
      <span>{children}</span>
    </label>
  );
};

export type RadioProps<T = string> = {
  options: { text: string, value: T }[];
  value: T;
  onChange: (value: T) => void;
}

export const Radio = <T,>({ options, value, onChange }: RadioProps<T>) => {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {options.map((option, i) => (
        <RadioItem key={i} isActive={option.value === value} onClick={() => onChange(option.value)}>
          {option.text}
        </RadioItem>
      ))}
    </div>
  );
};
