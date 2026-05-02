import { useMemo, useState } from "react";
import { RoastBadge } from "@/components/RoastBadge";
import { StarRating } from "@/components/StarRating";
import { useBeans } from "@/hooks/useBeans";
import { useRoastLevels } from "@/hooks/useRoastLevels";
import { useRoastLogs } from "@/hooks/useRoastLogs";

const FILTERS = [
  { id: "all", label: "すべて" },
  { id: "bean", label: "豆" },
  { id: "roast", label: "焙煎度" },
  { id: "score", label: "スコア" },
  { id: "date", label: "日付" },
] as const;

function calcWeightLossRate(before: number, after: number): number {
  if (before <= 0) return 0;
  return (1 - after / before) * 100;
}

export function RoastLogListPage() {
  const [filter, setFilter] = useState<string>("all");
  const { data: logs = [], isLoading } = useRoastLogs();
  const { data: beans = [] } = useBeans();
  const { data: levels = [] } = useRoastLevels();

  const beanMap = useMemo(
    () => Object.fromEntries(beans.map((b) => [b.id, b])),
    [beans],
  );
  const levelMap = useMemo(
    () => Object.fromEntries(levels.map((l) => [l.id, l])),
    [levels],
  );
  const bestLogIds = useMemo(
    () => new Set(beans.map((b) => b.bestLogId).filter(Boolean)),
    [beans],
  );

  // TODO: filter chips (bean/roast/score/date) are UI stubs; apply filter logic when implemented
  const sorted = useMemo(
    () => [...logs].sort((a, b) => b.roastDate.localeCompare(a.roastDate)),
    [logs],
  );

  if (isLoading) return null;

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--background)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <header
        style={{
          flexShrink: 0,
          height: 52,
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
          background: "var(--background)",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <div style={{ width: 44 }} />
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontWeight: 500,
            fontSize: 18,
            color: "var(--foreground)",
          }}
        >
          焙煎ログ
        </div>
        <button
          type="button"
          aria-label="検索"
          style={{
            width: 44,
            height: 44,
            background: "transparent",
            border: 0,
            color: "var(--foreground)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </button>
      </header>

      {/* Filter chips */}
      <div
        style={{
          flexShrink: 0,
          padding: "8px 16px 10px",
          display: "flex",
          gap: 6,
          overflowX: "auto",
          borderBottom: "0.5px solid var(--border)",
          scrollbarWidth: "none",
        }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              type="button"
              key={f.id}
              aria-pressed={active}
              onClick={() => setFilter(f.id)}
              style={{
                flexShrink: 0,
                height: 32,
                padding: "0 12px",
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                whiteSpace: "nowrap",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                background: active ? "var(--foreground)" : "var(--card)",
                color: active ? "#FFFFFF" : "var(--muted-foreground)",
                border: active
                  ? "0.5px solid var(--foreground)"
                  : "0.5px solid var(--border)",
                transition: "background 120ms ease, color 120ms ease",
              }}
            >
              {f.label}
              {f.id !== "all" && (
                <svg
                  aria-hidden="true"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ opacity: 0.7 }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Log list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px 160px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {sorted.length === 0 ? (
          <p
            style={{
              color: "var(--muted-foreground)",
              textAlign: "center",
              paddingTop: 40,
              fontSize: 14,
            }}
          >
            焙煎ログがありません
          </p>
        ) : (
          sorted.map((log) => {
            const bean = beanMap[log.beanId];
            const level = levelMap[log.roastLevelId];
            const isBest = bestLogIds.has(log.id);
            const cleanliness = log.tasting?.cleanliness ?? null;
            const isDanger = cleanliness != null && cleanliness <= 2;
            const rate = calcWeightLossRate(
              log.weightBeforeG,
              log.weightAfterG,
            );

            return (
              <div
                key={log.id}
                style={{
                  background: "var(--card)",
                  border: isDanger
                    ? "0.5px solid #B83232"
                    : "0.5px solid var(--border)",
                  borderRadius: 10,
                  padding: 12,
                  boxShadow:
                    "0 1px 2px rgba(28,23,20,0.04), 0 1px 1px rgba(28,23,20,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: 16,
                      fontWeight: 500,
                      color: "var(--foreground)",
                      lineHeight: 1.3,
                    }}
                  >
                    {bean?.name ?? "—"}
                  </span>
                  {isDanger ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: "#FDEAEA",
                        color: "#B83232",
                        flexShrink: 0,
                      }}
                    >
                      要確認
                    </span>
                  ) : level ? (
                    <RoastBadge level={level} />
                  ) : null}
                </div>

                <div
                  style={{
                    marginTop: 4,
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 11,
                    color: "var(--muted-foreground)",
                  }}
                >
                  {log.roastDate} · 減少率 {rate.toFixed(1)}%
                </div>

                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <StarRating value={log.overallScore} size={14} />
                  {isBest && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: "#E0F2E9",
                        color: "#2D7D52",
                      }}
                    >
                      ベスト
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom CTA */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "12px 16px 14px",
          background:
            "linear-gradient(to top, var(--background) 60%, transparent)",
          pointerEvents: "none",
        }}
      >
        {/* TODO: add onClick to navigate to /logs/new once that route is created */}
        <button
          type="button"
          style={{
            pointerEvents: "auto",
            width: "100%",
            height: 52,
            borderRadius: 10,
            border: 0,
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow:
              "0 4px 12px rgba(176,107,30,0.28), 0 2px 4px rgba(28,23,20,0.08)",
          }}
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          新しい焙煎を記録
        </button>
      </div>
    </div>
  );
}
