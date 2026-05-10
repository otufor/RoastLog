import {
  type RoastLog,
  RoastLogSchema,
  TastingSchema,
} from "@/schemas/roastLog";

export type ParseResult =
  | { ok: true; rows: RoastLog[] }
  | { ok: false; error: string };

const REQUIRED_HEADERS = [
  "id",
  "beanId",
  "roastDate",
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
];

function parseCSVLine(line: string): string[] {
  const cells: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      // quoted cell
      let cell = "";
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          cell += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          cell += line[i];
          i++;
        }
      }
      cells.push(cell);
      if (line[i] === ",") i++;
    } else {
      const end = line.indexOf(",", i);
      if (end === -1) {
        cells.push(line.slice(i));
        break;
      }
      cells.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return cells;
}

function toNum(s: string): number {
  return Number(s);
}

function toNumOrNull(s: string): number | null {
  return s === "" ? null : Number(s);
}

function toStrOrNull(s: string): string | null {
  return s === "" ? null : s;
}

function deserializeRow(headers: string[], cells: string[]): unknown {
  const get = (h: string) => cells[headers.indexOf(h)] ?? "";

  const tastingFlavorTagsRaw = get("tasting_flavorTags");
  const hasTasting = tastingFlavorTagsRaw !== "";

  const tasting = hasTasting
    ? TastingSchema.parse({
        flavorTags: JSON.parse(tastingFlavorTagsRaw),
        sweetness: toNum(get("tasting_sweetness")),
        acidity: toNum(get("tasting_acidity")),
        body: toNum(get("tasting_body")),
        bitterness: toNum(get("tasting_bitterness")),
        aftertaste: toNum(get("tasting_aftertaste")),
        cleanliness: toNum(get("tasting_cleanliness")),
      })
    : null;

  return {
    id: get("id"),
    beanId: get("beanId"),
    roastDate: get("roastDate"),
    roastLevelId: get("roastLevelId"),
    roastDeviceId: toStrOrNull(get("roastDeviceId")),
    roastDurationSec: toNum(get("roastDurationSec")),
    firstCrackSec: toNumOrNull(get("firstCrackSec")),
    secondCrackSec: toNumOrNull(get("secondCrackSec")),
    weightBeforeG: toNum(get("weightBeforeG")),
    weightAfterG: toNum(get("weightAfterG")),
    outdoorTempC: toNumOrNull(get("outdoorTempC")),
    outdoorHumidity: toNumOrNull(get("outdoorHumidity")),
    indoorTempC: toNumOrNull(get("indoorTempC")),
    tempSource: get("tempSource"),
    weatherCode: toNumOrNull(get("weatherCode")),
    tasting,
    overallScore: toNumOrNull(get("overallScore")),
    processNote: get("processNote"),
  };
}

export function parseRoastLogCSV(text: string): ParseResult {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  if (lines.length === 0) {
    return { ok: false, error: "ヘッダー行がありません" };
  }

  const headers = parseCSVLine(lines[0]);
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return {
      ok: false,
      error: `ヘッダーが不足しています: ${missing.join(", ")}`,
    };
  }

  const rows: RoastLog[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    try {
      const raw = deserializeRow(headers, cells);
      rows.push(RoastLogSchema.parse(raw));
    } catch (e) {
      return {
        ok: false,
        error: `行 ${i + 1} のデータが不正です: ${String(e)}`,
      };
    }
  }

  return { ok: true, rows };
}

export function mergeImport(
  incoming: RoastLog[],
  existing: RoastLog[],
  mode: "overwrite" | "skip",
): RoastLog[] {
  const map = new Map(existing.map((r) => [r.id, r]));
  for (const row of incoming) {
    if (mode === "overwrite" || !map.has(row.id)) {
      map.set(row.id, row);
    }
  }
  return Array.from(map.values());
}
