interface Props {
  value: number | null;
  max?: number;
  size?: number;
  onChange?: (value: number) => void;
}

export function StarRating({ value, max = 5, size = 16, onChange }: Props) {
  const label = value != null ? `${value}星 / ${max}星` : "未評価";
  return (
    <span
      role="img"
      aria-label={label}
      style={{ display: "inline-flex", gap: 1, lineHeight: 1 }}
    >
      {Array.from({ length: max }).map((_, i) => {
        const filled = value != null && i < value;
        const label = `${i + 1}星`;
        if (onChange) {
          return (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: star positions are positional by design
              key={i}
              type="button"
              aria-label={label}
              onClick={() => onChange(i + 1)}
              style={{
                background: "transparent",
                border: 0,
                padding: 0,
                cursor: "pointer",
                color: filled ? "#D4943A" : "var(--border)",
                fontSize: size,
                lineHeight: 1,
                minWidth: 44,
                minHeight: 44,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {filled ? "★" : "☆"}
            </button>
          );
        }
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: star positions are positional by design
            key={i}
            aria-hidden="true"
            style={{
              color: filled ? "#D4943A" : "var(--border)",
              fontSize: size,
              lineHeight: 1,
            }}
          >
            {filled ? "★" : "☆"}
          </span>
        );
      })}
    </span>
  );
}
