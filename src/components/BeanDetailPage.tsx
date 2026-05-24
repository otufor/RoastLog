import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { RoastBadge } from "@/components/RoastBadge";
import { StarRating } from "@/components/StarRating";
import { calcWeightLossRate } from "@/domain/roastLog";
import { useBean } from "@/hooks/useBeans";
import { useFlavorTags } from "@/hooks/useFlavorTags";
import {
  useDeleteBean,
  useSetBestLog,
  useUpdateBean,
} from "@/hooks/useMutateBean";
import { useRoastLevels } from "@/hooks/useRoastLevels";
import { useRoastLogs } from "@/hooks/useRoastLogs";
import type { Bean } from "@/schemas/bean";

function stockPct(bean: Bean): number {
  if (bean.totalG > 0) return (bean.stockG / bean.totalG) * 100;
  return bean.stockG > 0 ? 100 : 0;
}

function StockBar({ pct }: { pct: number }) {
  let color = "#2D7D52";
  if (pct === 0) color = "var(--border)";
  else if (pct < 20) color = "#B83232";
  else if (pct < 50) color = "#D4943A";
  return (
    <div
      style={{
        height: 4,
        background: "var(--border)",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.max(0, Math.min(100, pct))}%`,
          background: color,
          borderRadius: 2,
        }}
      />
    </div>
  );
}

export function BeanDetailPage({ beanId }: { beanId: string }) {
  const navigate = useNavigate();
  const { data: bean, isLoading: beanLoading } = useBean(beanId);
  const { data: logs = [], isLoading: logsLoading } = useRoastLogs();
  const { data: levels = [], isLoading: levelsLoading } = useRoastLevels();
  const { data: flavorTags = [], isLoading: tagsLoading } = useFlavorTags();
  const { mutateAsync: deleteBean } = useDeleteBean();
  const { mutateAsync: updateBean } = useUpdateBean();
  const { mutateAsync: setBestLog } = useSetBestLog();

  const [stockSheet, setStockSheet] = useState(false);
  const [adjustAmt, setAdjustAmt] = useState("");
  const [adjustMode, setAdjustMode] = useState<"add" | "set">("add");

  if (beanLoading || logsLoading || levelsLoading || tagsLoading) return null;

  if (!bean) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "var(--muted-foreground)", marginBottom: 12 }}>
          生豆が見つかりません
        </p>
        <Link
          to="/beans"
          style={{ color: "var(--primary)", textDecoration: "none" }}
        >
          一覧へ戻る
        </Link>
      </div>
    );
  }

  const levelMap = Object.fromEntries(levels.map((l) => [l.id, l]));
  const tagMap = Object.fromEntries(flavorTags.map((t) => [t.id, t]));
  const beanLogs = logs
    .filter((l) => l.beanId === beanId)
    .sort((a, b) => b.roastDate.localeCompare(a.roastDate));
  const bestLog = bean.bestLogId
    ? (beanLogs.find((l) => l.id === bean.bestLogId) ?? null)
    : null;
  const suggestedLog =
    bestLog === null
      ? beanLogs
          .filter((log) => log.overallScore != null)
          .reduce<(typeof beanLogs)[0] | null>((best, log) => {
            if (!best || (log.overallScore ?? 0) > (best.overallScore ?? 0))
              return log;
            return best;
          }, null)
      : null;

  const pct = stockPct(bean);

  async function handleStockSave() {
    if (!bean) return;
    const amt = parseInt(adjustAmt, 10);
    if (Number.isNaN(amt)) return;
    const newG =
      adjustMode === "set" ? Math.max(0, amt) : Math.max(0, bean.stockG + amt);
    await updateBean({ ...bean, stockG: newG });
    setStockSheet(false);
    setAdjustAmt("");
  }

  const previewG =
    adjustMode === "add" &&
    adjustAmt !== "" &&
    !Number.isNaN(parseInt(adjustAmt, 10))
      ? Math.max(0, bean.stockG + parseInt(adjustAmt, 10))
      : null;

  const specRows = [
    { k: "産地", v: bean.origin },
    { k: "地域", v: bean.region },
    { k: "精製", v: bean.process },
    { k: "標高", v: bean.altitude },
    { k: "品種", v: bean.variety },
    { k: "購入先", v: bean.shopName },
    { k: "購入日", v: bean.purchasedAt ?? "" },
  ];

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
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
        <button
          type="button"
          aria-label="戻る"
          onClick={() => navigate({ to: "/beans" })}
          style={{
            width: 44,
            height: 44,
            background: "transparent",
            border: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--primary)",
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
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontWeight: 500,
            fontSize: 18,
            color: "var(--foreground)",
          }}
        >
          豆の詳細
        </div>
        <Link
          to="/beans/$beanId/edit"
          params={{ beanId: bean.id }}
          style={{
            height: 32,
            padding: "0 12px",
            display: "inline-flex",
            alignItems: "center",
            color: "var(--primary)",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          編集
        </Link>
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 32px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 24,
              fontWeight: 500,
              lineHeight: 1.25,
              color: "var(--foreground)",
            }}
          >
            {bean.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--muted-foreground)",
              marginTop: 4,
            }}
          >
            {[bean.origin, bean.region, bean.process]
              .filter(Boolean)
              .join(" · ")}
          </div>
          {bean.flavorTagIds.length > 0 && (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                flexWrap: "wrap",
                gap: 5,
              }}
            >
              {bean.flavorTagIds.map((tid) => {
                const tag = tagMap[tid];
                if (!tag) return null;
                return (
                  <span
                    key={tid}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "3px 8px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 500,
                      background: `${tag.color}1A`,
                      color: tag.color,
                      border: `0.5px solid ${tag.color}33`,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: tag.color,
                      }}
                    />
                    {tag.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Stock card */}
        <div
          style={{
            background: "var(--card)",
            border: "0.5px solid var(--border)",
            borderRadius: 10,
            padding: "14px 16px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 10,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--muted-foreground)",
                  marginBottom: 4,
                }}
              >
                在庫
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 28,
                    fontWeight: 500,
                    fontVariantNumeric: "tabular-nums",
                    color:
                      pct < 20 && pct > 0
                        ? "#B83232"
                        : pct === 0
                          ? "var(--muted-foreground)"
                          : "var(--foreground)",
                  }}
                >
                  {bean.stockG}
                </span>
                <span
                  style={{ fontSize: 13, color: "var(--muted-foreground)" }}
                >
                  g{bean.totalG > 0 ? ` / ${bean.totalG}g` : ""}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStockSheet(true)}
              style={{
                height: 36,
                padding: "0 14px",
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                border: 0,
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              在庫を更新
            </button>
          </div>
          <StockBar pct={pct} />
          <div
            style={{
              marginTop: 6,
              fontFamily: "ui-monospace, monospace",
              fontSize: 11,
              color: "var(--muted-foreground)",
            }}
          >
            残 {Math.round(pct)}%
          </div>
        </div>

        {/* Spec grid */}
        <div
          style={{
            background: "var(--card)",
            border: "0.5px solid var(--border)",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            marginBottom: 12,
          }}
        >
          {specRows.map((row, i) => (
            <div
              key={row.k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderTop: i > 0 ? "0.5px solid var(--border)" : "none",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                {row.k}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {row.v || "—"}
              </span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {bean.note && (
          <div
            style={{
              background: "var(--muted)",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 16,
              fontFamily: "Georgia, serif",
              fontSize: 13,
              lineHeight: 1.65,
              color: "var(--foreground)",
            }}
          >
            {bean.note}
          </div>
        )}

        {/* BestRecipe */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.06em",
              color: "var(--muted-foreground)",
              marginBottom: 8,
              paddingLeft: 2,
            }}
          >
            BestRecipe
          </div>
          {bestLog ? (
            <div
              style={{
                background: "var(--card)",
                border: "0.5px solid #2D7D52",
                borderRadius: 10,
                padding: "12px 14px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  {levelMap[bestLog.roastLevelId] && (
                    <RoastBadge
                      level={levelMap[bestLog.roastLevelId]}
                      size="sm"
                    />
                  )}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      padding: "2px 7px",
                      borderRadius: 999,
                      background: "rgba(45,125,82,0.12)",
                      color: "#2D7D52",
                    }}
                  >
                    ベスト
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 11,
                    color: "var(--muted-foreground)",
                  }}
                >
                  {bestLog.roastDate}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: 2,
                  }}
                >
                  <StarRating value={bestLog.overallScore} size={12} />
                </div>
                <div
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 11,
                    color: "var(--muted-foreground)",
                  }}
                >
                  {(() => {
                    const r = calcWeightLossRate(
                      bestLog.weightBeforeG,
                      bestLog.weightAfterG,
                    );
                    return r != null ? `${r.toFixed(1)}%` : "—";
                  })()}
                </div>
              </div>
            </div>
          ) : suggestedLog ? (
            <div
              style={{
                background: "var(--card)",
                border: "0.5px solid var(--border)",
                borderRadius: 10,
                padding: "12px 14px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted-foreground)",
                    marginBottom: 4,
                  }}
                >
                  候補: {suggestedLog.roastDate}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {levelMap[suggestedLog.roastLevelId] && (
                    <RoastBadge
                      level={levelMap[suggestedLog.roastLevelId]}
                      size="sm"
                    />
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setBestLog({ beanId: bean.id, logId: suggestedLog.id })
                }
                style={{
                  height: 34,
                  padding: "0 12px",
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                  border: 0,
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                BestRecipe に指定
              </button>
            </div>
          ) : (
            <div
              style={{
                background: "var(--card)",
                border: "0.5px solid var(--border)",
                borderRadius: 10,
                padding: "24px 0",
                textAlign: "center",
                fontSize: 13,
                color: "var(--muted-foreground)",
              }}
            >
              まだ指定されていません
            </div>
          )}
        </div>

        {/* Roast history */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.06em",
              color: "var(--muted-foreground)",
              marginBottom: 8,
              paddingLeft: 2,
            }}
          >
            焙煎履歴 ({beanLogs.length}回)
          </div>
          {beanLogs.length === 0 ? (
            <div
              style={{
                background: "var(--card)",
                border: "0.5px solid var(--border)",
                borderRadius: 10,
                padding: "24px 0",
                textAlign: "center",
                fontSize: 13,
                color: "var(--muted-foreground)",
              }}
            >
              まだ焙煎していません
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {beanLogs.map((log) => {
                const level = levelMap[log.roastLevelId];
                const isBest = bestLog?.id === log.id;
                const rate = calcWeightLossRate(
                  log.weightBeforeG,
                  log.weightAfterG,
                );
                return (
                  <div
                    key={log.id}
                    style={{
                      background: "var(--card)",
                      border: `0.5px solid ${isBest ? "#2D7D52" : "var(--border)"}`,
                      borderRadius: 10,
                      padding: "10px 14px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 4,
                        }}
                      >
                        {level && <RoastBadge level={level} size="sm" />}
                        {isBest && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 500,
                              padding: "2px 7px",
                              borderRadius: 999,
                              background: "rgba(45,125,82,0.12)",
                              color: "#2D7D52",
                            }}
                          >
                            ベスト
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontFamily: "ui-monospace, monospace",
                          fontSize: 11,
                          color: "var(--muted-foreground)",
                        }}
                      >
                        {log.roastDate}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginBottom: 2,
                        }}
                      >
                        <StarRating value={log.overallScore} size={12} />
                      </div>
                      <div
                        style={{
                          fontFamily: "ui-monospace, monospace",
                          fontSize: 11,
                          color: "var(--muted-foreground)",
                        }}
                      >
                        {log.weightBeforeG != null
                          ? `${log.weightBeforeG}g`
                          : "—"}{" "}
                        →{" "}
                        {log.weightAfterG != null
                          ? `${log.weightAfterG}g`
                          : "—"}{" "}
                        · {rate != null ? `${rate.toFixed(1)}%` : "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={async () => {
            if (!window.confirm("この生豆を削除しますか？")) return;
            await deleteBean(bean.id);
            await navigate({ to: "/beans" });
          }}
          style={{
            width: "100%",
            height: 44,
            borderRadius: 10,
            border: "0.5px solid #B83232",
            background: "transparent",
            color: "#B83232",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          削除
        </button>
      </div>

      {/* Stock update sheet */}
      {stockSheet && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          {/* backdrop */}
          <button
            type="button"
            aria-label="シートを閉じる"
            onClick={() => {
              setStockSheet(false);
              setAdjustAmt("");
            }}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              border: 0,
              cursor: "default",
            }}
          />
          <div
            role="dialog"
            aria-labelledby="stock-sheet-title"
            aria-modal="true"
            style={{
              position: "relative",
              width: "100%",
              background: "var(--card)",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
              padding: "14px 16px 32px",
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                background: "var(--border)",
                borderRadius: 2,
                margin: "0 auto 14px",
              }}
            />
            <h3
              id="stock-sheet-title"
              style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}
            >
              在庫を更新
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Mode toggle */}
              <div style={{ display: "flex", gap: 6 }}>
                {(["add", "set"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAdjustMode(m)}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      background:
                        adjustMode === m ? "var(--primary)" : "var(--muted)",
                      color:
                        adjustMode === m
                          ? "var(--primary-foreground)"
                          : "var(--muted-foreground)",
                      border: "0.5px solid transparent",
                    }}
                  >
                    {m === "add" ? "増減" : "直接入力"}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  htmlFor="adjust-input"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--muted-foreground)",
                  }}
                >
                  {adjustMode === "add"
                    ? "増減量（例: -50 で減量）"
                    : "現在の在庫量（g）"}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="adjust-input"
                    type="number"
                    value={adjustAmt}
                    onChange={(e) => setAdjustAmt(e.target.value)}
                    style={{
                      width: "100%",
                      height: 44,
                      padding: "0 40px 0 12px",
                      background: "var(--muted)",
                      border: "0.5px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 14,
                      fontFamily: "ui-monospace, monospace",
                      color: "var(--foreground)",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 13,
                      color: "var(--muted-foreground)",
                      pointerEvents: "none",
                    }}
                  >
                    g
                  </span>
                </div>
              </div>

              {/* Preview */}
              {previewG !== null && (
                <div
                  style={{
                    background: "var(--muted)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--muted-foreground)",
                    }}
                  >
                    更新後
                  </span>
                  <span
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: 18,
                      fontWeight: 500,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {previewG}g
                  </span>
                </div>
              )}

              {/* Save */}
              <button
                type="button"
                onClick={handleStockSave}
                disabled={!adjustAmt || Number.isNaN(parseInt(adjustAmt, 10))}
                style={{
                  width: "100%",
                  height: 50,
                  borderRadius: 10,
                  border: 0,
                  background:
                    !adjustAmt || Number.isNaN(parseInt(adjustAmt, 10))
                      ? "var(--muted)"
                      : "var(--primary)",
                  color:
                    !adjustAmt || Number.isNaN(parseInt(adjustAmt, 10))
                      ? "var(--muted-foreground)"
                      : "var(--primary-foreground)",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor:
                    !adjustAmt || Number.isNaN(parseInt(adjustAmt, 10))
                      ? "default"
                      : "pointer",
                }}
              >
                更新する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
