import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { RoastBadge } from "@/components/RoastBadge";
import { StarRating } from "@/components/StarRating";
import {
  calcWeightLossRate,
  filterAndSortLogs,
  type LogFilter,
  type LogSortDir,
  type LogSortKey,
} from "@/domain/roastLog";
import { useBeans } from "@/hooks/useBeans";
import { useRoastDevices } from "@/hooks/useRoastDevices";
import { useRoastLevels } from "@/hooks/useRoastLevels";
import { useRoastLogs } from "@/hooks/useRoastLogs";
import { weatherEmoji } from "@/lib/weatherEmoji";

const FILTER_CHIPS = [
  { id: "all", label: "すべて" },
  { id: "bean", label: "豆" },
  { id: "roastLevel", label: "焙煎度" },
  { id: "device", label: "デバイス" },
  { id: "score", label: "スコア" },
  { id: "date", label: "日付" },
] as const;

type FilterChipId = (typeof FILTER_CHIPS)[number]["id"];

const SORT_OPTIONS: { value: `${LogSortKey}-${LogSortDir}`; label: string }[] =
  [
    { value: "roastDate-desc", label: "日付（新しい順）" },
    { value: "roastDate-asc", label: "日付（古い順）" },
    { value: "overallScore-desc", label: "スコア（高い順）" },
    { value: "overallScore-asc", label: "スコア（低い順）" },
    { value: "weightLossRate-desc", label: "減少率（高い順）" },
    { value: "weightLossRate-asc", label: "減少率（低い順）" },
  ];

export function RoastLogListPage() {
  const navigate = useNavigate();
  const [activeChip, setActiveChip] = useState<FilterChipId>("all");
  const [filter, setFilter] = useState<LogFilter>({});
  const [sortValue, setSortValue] =
    useState<`${LogSortKey}-${LogSortDir}`>("roastDate-desc");

  const { data: logs = [], isLoading: logsLoading } = useRoastLogs();
  const { data: beans = [], isLoading: beansLoading } = useBeans();
  const { data: levels = [], isLoading: levelsLoading } = useRoastLevels();
  const { data: devices = [], isLoading: devicesLoading } = useRoastDevices();

  if (logsLoading || beansLoading || levelsLoading || devicesLoading)
    return null;

  const beanMap = Object.fromEntries(beans.map((b) => [b.id, b]));
  const levelMap = Object.fromEntries(levels.map((l) => [l.id, l]));
  const bestLogIds = new Set(beans.map((b) => b.bestLogId).filter(Boolean));

  const [sortKey, sortDir] = sortValue.split("-") as [LogSortKey, LogSortDir];
  const displayed = filterAndSortLogs(logs, filter, sortKey, sortDir);

  function handleChipClick(id: FilterChipId) {
    if (activeChip === id) {
      setActiveChip("all");
    } else {
      setActiveChip(id);
    }
  }

  function handleSortChange(val: string) {
    setSortValue(val as `${LogSortKey}-${LogSortDir}`);
  }

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
        <select
          aria-label="並び順"
          value={sortValue}
          onChange={(e) => handleSortChange(e.target.value)}
          style={{
            height: 32,
            padding: "0 8px",
            border: "0.5px solid var(--border)",
            borderRadius: 6,
            background: "var(--card)",
            color: "var(--foreground)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </header>

      {/* Filter chips */}
      <div
        style={{
          flexShrink: 0,
          padding: "8px 16px 10px",
          display: "flex",
          gap: 6,
          overflowX: "auto",
          borderBottom:
            activeChip === "all" ? "0.5px solid var(--border)" : "none",
          scrollbarWidth: "none",
        }}
      >
        {FILTER_CHIPS.map((f) => {
          const active = activeChip === f.id;
          return (
            <button
              type="button"
              key={f.id}
              aria-pressed={active}
              onClick={() => handleChipClick(f.id)}
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

      {/* Filter panel */}
      {activeChip !== "all" && (
        <div
          style={{
            flexShrink: 0,
            padding: "8px 16px 12px",
            borderBottom: "0.5px solid var(--border)",
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          {activeChip === "bean" && (
            <select
              aria-label="豆で絞り込み"
              value={filter.beanId ?? ""}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  beanId: e.target.value || undefined,
                }))
              }
              style={selectStyle}
            >
              <option value="">すべての豆</option>
              {beans.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {activeChip === "roastLevel" && (
            <select
              aria-label="焙煎度で絞り込み"
              value={filter.roastLevelId ?? ""}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  roastLevelId: e.target.value || undefined,
                }))
              }
              style={selectStyle}
            >
              <option value="">すべての焙煎度</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          )}

          {activeChip === "device" && (
            <select
              aria-label="デバイスで絞り込み"
              value={filter.roastDeviceId ?? ""}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  roastDeviceId: e.target.value || undefined,
                }))
              }
              style={selectStyle}
            >
              <option value="">すべてのデバイス</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {activeChip === "score" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                最低
                <input
                  type="number"
                  aria-label="最低スコア"
                  min={1}
                  max={5}
                  value={filter.scoreMin ?? ""}
                  onChange={(e) =>
                    setFilter((f) => ({
                      ...f,
                      scoreMin: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  style={{ ...inputStyle, width: 56, marginLeft: 6 }}
                />
              </label>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                〜
              </span>
              <label style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                最高
                <input
                  type="number"
                  aria-label="最高スコア"
                  min={1}
                  max={5}
                  value={filter.scoreMax ?? ""}
                  onChange={(e) =>
                    setFilter((f) => ({
                      ...f,
                      scoreMax: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  style={{ ...inputStyle, width: 56, marginLeft: 6 }}
                />
              </label>
            </div>
          )}

          {activeChip === "date" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                から
                <input
                  type="date"
                  aria-label="開始日"
                  value={filter.dateFrom ?? ""}
                  onChange={(e) =>
                    setFilter((f) => ({
                      ...f,
                      dateFrom: e.target.value || undefined,
                    }))
                  }
                  style={{ ...inputStyle, marginLeft: 6 }}
                />
              </label>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                〜
              </span>
              <label style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                まで
                <input
                  type="date"
                  aria-label="終了日"
                  value={filter.dateTo ?? ""}
                  onChange={(e) =>
                    setFilter((f) => ({
                      ...f,
                      dateTo: e.target.value || undefined,
                    }))
                  }
                  style={{ ...inputStyle, marginLeft: 6 }}
                />
              </label>
            </div>
          )}
        </div>
      )}

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
        {displayed.length === 0 ? (
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
          displayed.map((log) => {
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
              <button
                type="button"
                key={log.id}
                aria-label={`${bean?.name ?? "—"} ${log.roastDate}`}
                onClick={() =>
                  navigate({ to: "/logs/$logId", params: { logId: log.id } })
                }
                style={{
                  background: "var(--card)",
                  border: isDanger
                    ? "0.5px solid #B83232"
                    : "0.5px solid var(--border)",
                  borderRadius: 10,
                  padding: 12,
                  boxShadow:
                    "0 1px 2px rgba(28,23,20,0.04), 0 1px 1px rgba(28,23,20,0.03)",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
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
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>
                    {log.roastDate} · 減少率 {rate.toFixed(1)}%
                  </span>
                  {log.weatherCode != null && weatherEmoji(log.weatherCode) && (
                    <span role="img" aria-label="天気" style={{ fontSize: 14 }}>
                      {weatherEmoji(log.weatherCode)}
                    </span>
                  )}
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
              </button>
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
        <button
          type="button"
          onClick={() => navigate({ to: "/logs/new" })}
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

const selectStyle: React.CSSProperties = {
  height: 32,
  padding: "0 8px",
  border: "0.5px solid var(--border)",
  borderRadius: 6,
  background: "var(--card)",
  color: "var(--foreground)",
  fontSize: 12,
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  height: 32,
  padding: "0 8px",
  border: "0.5px solid var(--border)",
  borderRadius: 6,
  background: "var(--card)",
  color: "var(--foreground)",
  fontSize: 12,
};
