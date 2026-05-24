import type { RoastLog } from "@/schemas/roastLog";

export type LogFilter = {
  beanId?: string;
  roastLevelId?: string;
  roastDeviceId?: string;
  scoreMin?: number;
  scoreMax?: number;
  dateFrom?: string;
  dateTo?: string;
};

export type LogSortKey = "roastDate" | "overallScore" | "weightLossRate";
export type LogSortDir = "asc" | "desc";

export function filterAndSortLogs(
  logs: RoastLog[],
  filter: LogFilter,
  sortKey: LogSortKey,
  sortDir: LogSortDir,
): RoastLog[] {
  const filtered = logs.filter((log) => {
    if (filter.beanId && log.beanId !== filter.beanId) return false;
    if (filter.roastLevelId && log.roastLevelId !== filter.roastLevelId)
      return false;
    if (filter.roastDeviceId !== undefined) {
      if (log.roastDeviceId !== filter.roastDeviceId) return false;
    }
    if (filter.scoreMin != null) {
      if (log.overallScore == null || log.overallScore < filter.scoreMin)
        return false;
    }
    if (filter.scoreMax != null) {
      if (log.overallScore == null || log.overallScore > filter.scoreMax)
        return false;
    }
    if (filter.dateFrom && log.roastDate < filter.dateFrom) return false;
    if (filter.dateTo && log.roastDate > filter.dateTo) return false;
    return true;
  });

  return filtered.sort((a, b) => {
    let cmp = 0;
    if (sortKey === "roastDate") {
      cmp = a.roastDate.localeCompare(b.roastDate);
    } else if (sortKey === "overallScore") {
      cmp = (a.overallScore ?? 0) - (b.overallScore ?? 0);
    } else {
      cmp =
        calcWeightLossRate(a.weightBeforeG, a.weightAfterG) -
        calcWeightLossRate(b.weightBeforeG, b.weightAfterG);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });
}

export function calcWeightLossRate(
  weightBeforeG: number,
  weightAfterG: number,
): number {
  if (weightBeforeG <= 0) return 0;
  return (1 - weightAfterG / weightBeforeG) * 100;
}

export function isCleanlinessWarning(cleanliness: number): boolean {
  return cleanliness <= 2;
}

export function isStockInsufficient(
  stockG: number,
  weightBeforeG: number,
): boolean {
  return stockG < weightBeforeG;
}
