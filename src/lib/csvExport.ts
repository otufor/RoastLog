import type { RoastLog } from "@/schemas/roastLog";

const HEADERS = [
  "id",
  "beanId",
  "roastStartTime",
  "roastLevelId",
  "roastDeviceId",
  "roastDurationSec",
  "firstCrackSec",
  "secondCrackSec",
  "weightBeforeG",
  "weightAfterG",
  "outdoorTempC",
  "outdoorHumidity",
  "indoorTempC",
  "tempSource",
  "weatherCode",
  "tasting_flavorTags",
  "tasting_sweetness",
  "tasting_acidity",
  "tasting_body",
  "tasting_bitterness",
  "tasting_aftertaste",
  "tasting_cleanliness",
  "overallScore",
  "processNote",
] as const;

function escapeCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function serializeRow(log: RoastLog): string {
  const cells: string[] = [
    log.id,
    log.beanId,
    log.roastStartTime,
    log.roastLevelId,
    log.roastDeviceId ?? "",
    String(log.roastDurationSec),
    log.firstCrackSec != null ? String(log.firstCrackSec) : "",
    log.secondCrackSec != null ? String(log.secondCrackSec) : "",
    log.weightBeforeG != null ? String(log.weightBeforeG) : "",
    log.weightAfterG != null ? String(log.weightAfterG) : "",
    log.outdoorTempC != null ? String(log.outdoorTempC) : "",
    log.outdoorHumidity != null ? String(log.outdoorHumidity) : "",
    log.indoorTempC != null ? String(log.indoorTempC) : "",
    log.tempSource,
    log.weatherCode != null ? String(log.weatherCode) : "",
    log.tasting != null ? JSON.stringify(log.tasting.flavorTags) : "",
    log.tasting != null ? String(log.tasting.sweetness) : "",
    log.tasting != null ? String(log.tasting.acidity) : "",
    log.tasting != null ? String(log.tasting.body) : "",
    log.tasting != null ? String(log.tasting.bitterness) : "",
    log.tasting != null ? String(log.tasting.aftertaste) : "",
    log.tasting != null ? String(log.tasting.cleanliness) : "",
    log.overallScore != null ? String(log.overallScore) : "",
    log.processNote,
  ];
  return cells.map(escapeCell).join(",");
}

export function roastLogsToCSV(logs: RoastLog[]): string {
  const rows = [HEADERS.join(","), ...logs.map(serializeRow)];
  return rows.join("\n");
}

export function downloadCSV(csv: string, filename: string): void {
  const bom = "﻿";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
