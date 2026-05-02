import type { RoastLevel } from "@/schemas/masterData";

interface Props {
  level: RoastLevel;
  size?: "sm" | "md";
}

export function RoastBadge({ level, size = "md" }: Props) {
  const sm = size === "sm";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: sm ? 4 : 5,
        padding: sm ? "2px 8px" : "3px 10px",
        borderRadius: 999,
        fontSize: sm ? 10 : 11,
        fontWeight: 500,
        background: `${level.color}1A`,
        color: level.color,
        border: `0.5px solid ${level.color}66`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: sm ? 6 : 7,
          height: sm ? 6 : 7,
          borderRadius: "50%",
          background: level.color,
          flexShrink: 0,
        }}
      />
      {level.label}
    </span>
  );
}
