import { useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useBeans } from "@/hooks/useBeans";
import { useFlavorTags } from "@/hooks/useFlavorTags";
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
          transition: "width 320ms ease",
        }}
      />
    </div>
  );
}

function StockBadge({ pct }: { pct: number }) {
  if (pct === 0)
    return (
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          padding: "2px 7px",
          borderRadius: 999,
          background: "var(--muted)",
          color: "var(--muted-foreground)",
          border: "0.5px solid var(--border)",
        }}
      >
        在庫切れ
      </span>
    );
  if (pct < 20)
    return (
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          padding: "2px 7px",
          borderRadius: 999,
          background: "#FDEAEA",
          color: "#B83232",
          border: "0.5px solid #B8323233",
        }}
      >
        残りわずか
      </span>
    );
  return null;
}

type StockFilter = "all" | "instock" | "low" | "out";

export function BeanListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filterStock, setFilterStock] = useState<StockFilter>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: beans = [], isLoading: beansLoading } = useBeans();
  const { data: logs = [], isLoading: logsLoading } = useRoastLogs();
  const { data: flavorTags = [], isLoading: tagsLoading } = useFlavorTags();

  if (beansLoading || logsLoading || tagsLoading) return null;

  const tagMap = Object.fromEntries(flavorTags.map((t) => [t.id, t]));
  const roastCountMap = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.beanId] = (acc[l.beanId] ?? 0) + 1;
    return acc;
  }, {});

  const totalBeans = beans.length;
  const lowStockCount = beans.filter((b) => {
    const p = stockPct(b);
    return p > 0 && p < 20;
  }).length;
  const outStockCount = beans.filter((b) => stockPct(b) === 0).length;

  const filtered = beans.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.origin.toLowerCase().includes(q);
    const pct = stockPct(b);
    const matchStock =
      filterStock === "all"
        ? true
        : filterStock === "instock"
          ? pct >= 20
          : filterStock === "low"
            ? pct > 0 && pct < 20
            : filterStock === "out"
              ? pct === 0
              : true;
    return matchSearch && matchStock;
  });

  function chipStyle(
    id: StockFilter,
    warn = false,
    danger = false,
  ): React.CSSProperties {
    const active = filterStock === id;
    let bg = active ? "var(--foreground)" : "var(--card)";
    let color = active ? "#fff" : "var(--muted-foreground)";
    if (!active && warn && lowStockCount > 0) {
      bg = "#FFF8E8";
      color = "#D4943A";
    }
    if (!active && danger && outStockCount > 0) {
      bg = "#FDEAEA";
      color = "#B83232";
    }
    return {
      padding: "5px 10px",
      borderRadius: 999,
      fontSize: 11,
      whiteSpace: "nowrap",
      fontWeight: 500,
      cursor: "pointer",
      background: bg,
      color,
      border: `0.5px solid ${active ? "var(--foreground)" : "var(--border)"}`,
      flexShrink: 0,
    };
  }

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
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
          豆
        </div>
        <button
          type="button"
          aria-label="検索"
          aria-pressed={showSearch}
          onClick={() => {
            setShowSearch((s) => !s);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          style={{
            width: 44,
            height: 44,
            background: "transparent",
            border: 0,
            color: showSearch ? "var(--primary)" : "var(--foreground)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
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

      {/* Search bar */}
      {showSearch && (
        <div style={{ padding: "8px 16px 4px", flexShrink: 0 }}>
          <div
            style={{
              height: 40,
              padding: "0 12px",
              background: "var(--muted)",
              border: "0.5px solid var(--border)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--muted-foreground)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              aria-label="豆を検索"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="豆を検索…"
              style={{
                flex: 1,
                background: "transparent",
                border: 0,
                outline: "none",
                fontSize: 14,
                color: "var(--foreground)",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="検索をクリア"
                style={{
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                  color: "var(--muted-foreground)",
                  display: "flex",
                }}
              >
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div
        style={{
          flexShrink: 0,
          padding: "8px 16px 10px",
          display: "flex",
          gap: 6,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        <button
          type="button"
          style={chipStyle("all")}
          onClick={() => setFilterStock("all")}
        >
          すべて {totalBeans}
        </button>
        <button
          type="button"
          style={chipStyle("instock")}
          onClick={() => setFilterStock("instock")}
        >
          在庫あり
        </button>
        <button
          type="button"
          style={chipStyle("low", true)}
          onClick={() => setFilterStock("low")}
        >
          残りわずか{lowStockCount > 0 ? ` ${lowStockCount}` : ""}
        </button>
        <button
          type="button"
          style={chipStyle("out", false, true)}
          onClick={() => setFilterStock("out")}
        >
          在庫切れ{outStockCount > 0 ? ` ${outStockCount}` : ""}
        </button>
      </div>

      {/* Bean list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 16px 100px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {filtered.length === 0 ? (
          <p
            style={{
              paddingTop: 64,
              textAlign: "center",
              fontSize: 13,
              color: "var(--muted-foreground)",
            }}
          >
            {search
              ? `「${search}」に一致する豆がありません`
              : "豆がありません"}
          </p>
        ) : (
          filtered.map((bean) => {
            const pct = stockPct(bean);
            const count = roastCountMap[bean.id] ?? 0;
            return (
              <button
                type="button"
                key={bean.id}
                onClick={() =>
                  navigate({
                    to: "/beans/$beanId",
                    params: { beanId: bean.id },
                  })
                }
                style={{
                  background: "var(--card)",
                  border: "0.5px solid var(--border)",
                  borderRadius: 10,
                  padding: 12,
                  boxShadow:
                    "0 1px 2px rgba(28,23,20,0.04), 0 1px 1px rgba(28,23,20,0.03)",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                {/* Top row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "Georgia, serif",
                        fontSize: 16,
                        fontWeight: 500,
                        lineHeight: 1.3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {bean.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--muted-foreground)",
                        marginTop: 2,
                      }}
                    >
                      {bean.origin}
                      {bean.process ? ` · ${bean.process}` : ""}
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 3,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Georgia, serif",
                        fontSize: 18,
                        fontWeight: 500,
                        fontVariantNumeric: "tabular-nums",
                        lineHeight: 1,
                      }}
                    >
                      {bean.stockG}
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--muted-foreground)",
                          marginLeft: 2,
                          fontWeight: 400,
                        }}
                      >
                        g
                      </span>
                    </div>
                    <StockBadge pct={pct} />
                  </div>
                </div>

                {/* Stock bar */}
                <div style={{ marginTop: 10 }}>
                  <StockBar pct={pct} />
                </div>

                {/* Bottom meta */}
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 10,
                      color: "var(--muted-foreground)",
                    }}
                  >
                    残 {Math.round(pct)}% ·{" "}
                    {count > 0 ? `${count}回焙煎` : "未焙煎"}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    {bean.flavorTagIds.slice(0, 3).map((tid) => {
                      const tag = tagMap[tid];
                      if (!tag) return null;
                      return (
                        <span
                          key={tid}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "2px 7px",
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 500,
                            background: `${tag.color}1A`,
                            color: tag.color,
                            border: `0.5px solid ${tag.color}33`,
                          }}
                        >
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              background: tag.color,
                            }}
                          />
                          {tag.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        aria-label="豆を追加"
        onClick={() => navigate({ to: "/beans/new" })}
        style={{
          position: "absolute",
          right: 16,
          bottom: 76,
          zIndex: 5,
          width: 56,
          height: 56,
          borderRadius: 999,
          border: 0,
          background: "var(--primary)",
          color: "var(--primary-foreground)",
          fontSize: 28,
          lineHeight: 1,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow:
            "0 4px 12px rgba(176,107,30,0.28), 0 2px 4px rgba(28,23,20,0.08)",
        }}
      >
        ＋
      </button>
    </div>
  );
}
