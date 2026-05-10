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
  logsWithTasting,
} from "@/domain/analysis";
import { useBeans } from "@/hooks/useBeans";
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

export function AnalysisPage() {
  const { data: beans = [], isLoading: beansLoading } = useBeans();
  const { data: allLogs = [], isLoading: logsLoading } = useRoastLogs();

  const [selectedBeanId, setSelectedBeanId] = useState<string | null>(null);
  const [overlayLogId, setOverlayLogId] = useState<string | null>(null);

  if (beansLoading || logsLoading) return null;

  const selectedBean = beans.find((b) => b.id === selectedBeanId) ?? null;
  const beanLogs = allLogs.filter((l) => l.beanId === selectedBeanId);
  const lineData =
    selectedBeanId !== null ? buildLineChartData(beanLogs) : null;

  const bestLog =
    selectedBean?.bestLogId != null
      ? (allLogs.find((l) => l.id === selectedBean.bestLogId) ?? null)
      : null;

  const overlayOptions = logsWithTasting(allLogs);
  const overlayLog =
    overlayLogId !== null
      ? (overlayOptions.find((l) => l.id === overlayLogId) ?? null)
      : null;

  const radarEntries: { label: string; tasting: RoastLog["tasting"] }[] = [
    ...(bestLog?.tasting
      ? [{ label: "BestRecipe", tasting: bestLog.tasting }]
      : []),
    ...(overlayLog?.tasting
      ? [{ label: overlayLog.roastDate, tasting: overlayLog.tasting }]
      : []),
  ];
  const radarData =
    radarEntries.length > 0
      ? buildRadarChartData(
          radarEntries as {
            label: string;
            tasting: NonNullable<RoastLog["tasting"]>;
          }[],
        )
      : null;

  const radarKeys = radarEntries.map((e) => e.label);

  return (
    <div className="p-4 flex flex-col gap-8">
      <h1 className="text-2xl font-bold">分析</h1>

      {/* 折れ線グラフ */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" id="bean-label">
            豆
          </span>
          <Select
            value={selectedBeanId}
            onValueChange={(v) => setSelectedBeanId(v ?? null)}
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

        {lineData && (
          <div data-testid="line-chart" style={{ height: 300 }}>
            <ResponsiveLine
              data={lineData}
              margin={{ top: 10, right: 40, bottom: 40, left: 50 }}
              xScale={{ type: "linear" }}
              yScale={{ type: "linear", stacked: false }}
              axisBottom={{ legend: "焙煎回数", legendOffset: 32 }}
              axisLeft={{ legend: "値", legendOffset: -40 }}
              useMesh
            />
          </div>
        )}
      </section>

      {/* レーダーチャート */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">テイスティング比較</h2>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" id="overlay-label">
            重ね表示
          </span>
          <Select
            value={overlayLogId}
            onValueChange={(v) => setOverlayLogId(v ?? null)}
            items={overlayOptions.map((l) => ({
              value: l.id,
              label: l.roastDate,
            }))}
          >
            <SelectTrigger
              aria-label="重ね表示するログを選択"
              aria-labelledby="overlay-label"
            >
              <SelectValue placeholder="ログを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {overlayOptions.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.roastDate}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {radarData ? (
          <div style={{ height: 350 }}>
            <ResponsiveRadar
              data={radarData}
              keys={radarKeys}
              indexBy="metric"
              valueFormat=">-.1f"
              maxValue={5}
              margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
              gridLabelOffset={16}
              gridLabel={({ id }) => (
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={12}
                >
                  {RADAR_KEYS_JP[id] ?? id}
                </text>
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
