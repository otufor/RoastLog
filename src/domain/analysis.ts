import { calcWeightLossRate } from "@/domain/roastLog";
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
  const sorted = [...logs].sort((a, b) =>
    a.roastDate.localeCompare(b.roastDate),
  );

  const wlr: { x: number; y: number }[] = [];
  const fc: { x: number; y: number }[] = [];
  const sc: { x: number; y: number }[] = [];

  sorted.forEach((log, i) => {
    const x = i + 1;
    wlr.push({ x, y: calcWeightLossRate(log.weightBeforeG, log.weightAfterG) });
    if (log.firstCrackSec !== null) fc.push({ x, y: log.firstCrackSec });
    if (log.secondCrackSec !== null) sc.push({ x, y: log.secondCrackSec });
  });

  return [
    { id: "WeightLossRate", data: wlr },
    { id: "FirstCrack", data: fc },
    { id: "SecondCrack", data: sc },
  ];
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
