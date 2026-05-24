import { calcWeightLossRate } from "@/domain/roastLog";
import type { Bean } from "@/schemas/bean";
import type { RoastLog, Tasting } from "@/schemas/roastLog";

export type LineChartSeries = {
  id: string;
  data: { x: number; y: number }[];
};

export type RadarRow = Record<string, string | number>;

const TASTING_AXES = [
  "sweetness",
  "acidity",
  "body",
  "bitterness",
  "aftertaste",
  "cleanliness",
] as const;

export function buildLineChartData(logs: RoastLog[]): LineChartSeries[] {
  const sorted = [...logs]
    .sort((a, b) => a.roastStartTime.localeCompare(b.roastStartTime))
    .filter((log) => log.weightBeforeG !== null && log.weightAfterG !== null);
  return [
    {
      id: "WeightLossRate",
      data: sorted.map((log, i) => ({
        x: i + 1,
        y: calcWeightLossRate(log.weightBeforeG, log.weightAfterG) as number,
      })),
    },
  ];
}

export function selectDefaultLog(
  bean: Bean | null,
  beanLogs: RoastLog[],
): string | null {
  if (!bean) return null;
  const sorted = [...beanLogs].sort((a, b) =>
    b.roastStartTime.localeCompare(a.roastStartTime),
  );
  const best = bean.bestLogId
    ? (beanLogs.find((l) => l.id === bean.bestLogId && l.tasting !== null) ??
      null)
    : null;
  return (best ?? sorted.find((l) => l.tasting !== null) ?? null)?.id ?? null;
}

export function logsWithTasting(logs: RoastLog[]): RoastLog[] {
  return logs.filter((log) => log.tasting !== null);
}

export function buildRadarChartData(
  entries: { label: string; tasting: Tasting }[],
): RadarRow[] {
  return TASTING_AXES.map((axis) => {
    const row: RadarRow = { metric: axis };
    for (const { label, tasting } of entries) {
      row[label] = tasting[axis];
    }
    return row;
  });
}
