import { ResponsiveLine } from "@nivo/line";
import { ResponsiveRadar } from "@nivo/radar";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildLineChartData,
  buildRadarChartData,
  selectDefaultLog,
} from "@/domain/analysis";
import { calcWeightLossRate } from "@/domain/roastLog";
import { useBeans } from "@/hooks/useBeans";
import { useRoastLevels } from "@/hooks/useRoastLevels";
import { useRoastLogs } from "@/hooks/useRoastLogs";
import type { RoastLog } from "@/schemas/roastLog";

const RADAR_KEYS_JP: Record<string, string> = {
  sweetness: "甘み",
  acidity: "酸味",
  body: "コク",
  bitterness: "苦み",
  aftertaste: "後味",
  cleanliness: "クリーン",
};

const COLOR_1 = "#10B981";
const COLOR_2 = "#F97316";

const TOOLTIP_CLASS =
  "bg-card text-card-foreground border border-border rounded-sm px-2.5 py-1.5 text-[13px]";

const emptyMessageStyle = {
  fontSize: 13,
  color: "var(--muted-foreground)",
  padding: "24px 0",
  textAlign: "center",
} as const;

export function AnalysisPage() {
  const { data: beans = [], isLoading: beansLoading } = useBeans();
  const { data: allLogs = [], isLoading: logsLoading } = useRoastLogs();
  const { data: levels = [], isLoading: levelsLoading } = useRoastLevels();

  const [selectedBeanId, setSelectedBeanId] = useState<string | null>(null);
  const [selector1Id, setSelector1Id] = useState<string | null>(null);
  const [selector2Id, setSelector2Id] = useState<string | null>(null);

  if (beansLoading || logsLoading || levelsLoading) return null;

  const levelMap = Object.fromEntries(levels.map((l) => [l.id, l]));
  const beanLogs = allLogs
    .filter((l) => l.beanId === selectedBeanId)
    .sort((a, b) => b.roastDate.localeCompare(a.roastDate));

  const lineData =
    selectedBeanId !== null
      ? buildLineChartData([...beanLogs].reverse())
      : null;

  function handleBeanChange(beanId: string) {
    const bean = beans.find((b) => b.id === beanId) ?? null;
    const logs = allLogs.filter((l) => l.beanId === beanId);
    setSelectedBeanId(beanId);
    setSelector1Id(selectDefaultLog(bean, logs));
    setSelector2Id(null);
  }

  function handleCardClick(logId: string) {
    if (logId === selector1Id) {
      setSelector1Id(null);
      return;
    }
    if (logId === selector2Id) {
      setSelector2Id(null);
      return;
    }
    if (selector1Id === null) {
      setSelector1Id(logId);
      return;
    }
    if (selector2Id === null) {
      setSelector2Id(logId);
      return;
    }
    setSelector1Id(logId);
  }

  const log1 = selector1Id
    ? (allLogs.find((l) => l.id === selector1Id) ?? null)
    : null;
  const log2 = selector2Id
    ? (allLogs.find((l) => l.id === selector2Id) ?? null)
    : null;

  const radarEntries: {
    label: string;
    tasting: NonNullable<RoastLog["tasting"]>;
  }[] = [
    ...(log1?.tasting ? [{ label: "ログ1", tasting: log1.tasting }] : []),
    ...(log2?.tasting ? [{ label: "ログ2", tasting: log2.tasting }] : []),
  ];
  const radarData =
    radarEntries.length > 0 ? buildRadarChartData(radarEntries) : null;
  const radarKeys = radarEntries.map((e) => e.label);

  return (
    <div className="p-4 flex flex-col gap-8">
      <h1 className="text-2xl font-bold">分析</h1>

      {/* 豆セレクター */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" id="bean-label">
          豆
        </span>
        <Select
          value={selectedBeanId}
          onValueChange={(v) => {
            if (v) handleBeanChange(v);
          }}
          items={beans.map((b) => ({ value: b.id, label: b.name }))}
        >
          <SelectTrigger aria-label="豆を選択" aria-labelledby="bean-label">
            <SelectValue placeholder="豆を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {beans.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* 重量減少率の推移 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">重量減少率の推移</h2>
        {selectedBeanId !== null &&
          (beanLogs.length === 0 ? (
            <p style={emptyMessageStyle}>まだ焙煎ログがありません</p>
          ) : (
            <div data-testid="line-chart" style={{ height: 300 }}>
              <ResponsiveLine
                data={lineData ?? []}
                margin={{ top: 10, right: 40, bottom: 40, left: 50 }}
                xScale={{ type: "linear" }}
                yScale={{ type: "linear", stacked: false }}
                yFormat=">-.1f"
                theme={{ text: { fill: "currentColor" } }}
                axisBottom={{
                  legend: "焙煎回数",
                  legendOffset: 32,
                  format: (v) => (Number.isInteger(v) ? String(v) : ""),
                }}
                axisLeft={{ legend: "減少率 (%)", legendOffset: -40 }}
                useMesh
                tooltip={({ point }) => (
                  <div data-testid="analysis-tooltip" className={TOOLTIP_CLASS}>
                    {point.data.yFormatted}%
                  </div>
                )}
              />
            </div>
          ))}
      </section>

      {/* テイスティング比較 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">テイスティング比較</h2>

        {selectedBeanId !== null && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {beanLogs.map((log) => {
              const hasTasting = log.tasting !== null;
              const isSlot1 = log.id === selector1Id;
              const isSlot2 = log.id === selector2Id;
              const level = levelMap[log.roastLevelId];
              const wlr = calcWeightLossRate(
                log.weightBeforeG,
                log.weightAfterG,
              );
              let borderColor = "var(--border)";
              if (isSlot1) borderColor = COLOR_1;
              if (isSlot2) borderColor = COLOR_2;

              return (
                <button
                  key={log.id}
                  type="button"
                  disabled={!hasTasting}
                  aria-disabled={!hasTasting}
                  aria-pressed={isSlot1 || isSlot2}
                  onClick={() => hasTasting && handleCardClick(log.id)}
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${borderColor}`,
                    background: "var(--card)",
                    cursor: hasTasting ? "pointer" : "default",
                    opacity: hasTasting ? 1 : 0.4,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 13,
                    }}
                  >
                    {log.roastDate}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      fontSize: 12,
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {level?.label ?? "—"}
                    <span>
                      {log.overallScore != null
                        ? "★".repeat(log.overallScore)
                        : "—"}
                    </span>
                    <span style={{ fontFamily: "ui-monospace, monospace" }}>
                      {wlr.toFixed(1)}%
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {radarData ? (
          <div data-testid="radar-chart" style={{ height: 350 }}>
            <ResponsiveRadar
              data={radarData}
              keys={radarKeys}
              indexBy="metric"
              valueFormat=">-.1f"
              maxValue={5}
              colors={[COLOR_1, COLOR_2]}
              fillOpacity={0.4}
              margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
              gridLabelOffset={16}
              gridLabel={({ id, anchor, x, y }) => (
                <g transform={`translate(${x}, ${y})`}>
                  <text
                    textAnchor={anchor}
                    dominantBaseline="central"
                    fontSize={12}
                    fill="currentColor"
                  >
                    {RADAR_KEYS_JP[id] ?? id}
                  </text>
                </g>
              )}
              sliceTooltip={({ index, data }) => (
                <div className={TOOLTIP_CLASS}>
                  <div className="font-semibold mb-1">
                    {RADAR_KEYS_JP[String(index)] ?? String(index)}
                  </div>
                  {data.map((d) => (
                    <div
                      key={String(d.id)}
                      className="flex items-center gap-1.5"
                    >
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ background: d.color }}
                      />
                      <span>{String(d.id)}</span>
                      <span className="ml-auto pl-3">{d.formattedValue}</span>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            BestRecipeが設定されていません。豆を選択してBestRecipeを設定してください。
          </p>
        )}
      </section>
    </div>
  );
}
