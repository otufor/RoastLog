import { describe, expect, it } from "vitest";
import { roastLogsToCSV } from "@/lib/csvExport";
import { mergeImport, parseRoastLogCSV } from "@/lib/csvImport";
import type { RoastLog } from "@/schemas/roastLog";

const SAMPLE_LOG: RoastLog = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  beanId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  roastStartTime: "2024-01-15T00:00",
  roastLevelId: "medium",
  roastDeviceId: null,
  roastDurationSec: 720,
  firstCrackSec: 480,
  secondCrackSec: null,
  weightBeforeG: 200,
  weightAfterG: 170,
  outdoorTempC: 15.5,
  outdoorHumidity: 60,
  indoorTempC: null,
  tempSource: "auto",
  weatherCode: 0,
  tasting: {
    flavorTags: ["fruity", "chocolate"],
    sweetness: 4,
    acidity: 3,
    body: 3,
    bitterness: 2,
    aftertaste: 4,
    cleanliness: 5,
  },
  overallScore: 4,
  processNote: "順調",
};

describe("parseRoastLogCSV", () => {
  it("正常な CSV をパースして ok: true と rows を返す", () => {
    const csv = roastLogsToCSV([SAMPLE_LOG]);
    const result = parseRoastLogCSV(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual(SAMPLE_LOG);
  });

  it("tasting が null の RoastLog をラウンドトリップできる", () => {
    const log: RoastLog = { ...SAMPLE_LOG, tasting: null, overallScore: null };
    const csv = roastLogsToCSV([log]);
    const result = parseRoastLogCSV(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0]).toEqual(log);
  });

  it("processNote にカンマを含む RoastLog をラウンドトリップできる", () => {
    const log: RoastLog = { ...SAMPLE_LOG, processNote: "熱い,良い感じ" };
    const csv = roastLogsToCSV([log]);
    const result = parseRoastLogCSV(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0].processNote).toBe("熱い,良い感じ");
  });

  it("複数件をラウンドトリップできる", () => {
    const log2: RoastLog = {
      ...SAMPLE_LOG,
      id: "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    };
    const csv = roastLogsToCSV([SAMPLE_LOG, log2]);
    const result = parseRoastLogCSV(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(2);
  });

  it("ヘッダー行が欠けている場合は ok: false を返す", () => {
    const result = parseRoastLogCSV("");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/ヘッダー/);
  });

  it("必須ヘッダーが不足している場合は ok: false を返す", () => {
    const csv = "id,beanId\n11111111-1111-1111-1111-111111111111,22222222";
    const result = parseRoastLogCSV(csv);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/ヘッダー/);
  });

  it("データ行が Zod スキーマに違反する場合は ok: false を返す", () => {
    const csv = roastLogsToCSV([SAMPLE_LOG]).split("\n");
    // id を UUID でない値に書き換える
    csv[1] = csv[1].replace(SAMPLE_LOG.id, "not-a-uuid");
    const result = parseRoastLogCSV(csv.join("\n"));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/行 2/);
  });
});

describe("mergeImport", () => {
  const existing: RoastLog[] = [SAMPLE_LOG];
  const updated: RoastLog = { ...SAMPLE_LOG, processNote: "更新後" };

  it("overwrite モードで重複 ID のレコードを上書きする", () => {
    const result = mergeImport([updated], existing, "overwrite");
    expect(result).toHaveLength(1);
    expect(result[0].processNote).toBe("更新後");
  });

  it("skip モードで重複 ID のレコードをスキップする", () => {
    const result = mergeImport([updated], existing, "skip");
    expect(result).toHaveLength(1);
    expect(result[0].processNote).toBe("順調");
  });

  it("新規 ID のレコードはどちらのモードでも追加される", () => {
    const newLog: RoastLog = {
      ...SAMPLE_LOG,
      id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    };
    const resultOverwrite = mergeImport([newLog], existing, "overwrite");
    const resultSkip = mergeImport([newLog], existing, "skip");
    expect(resultOverwrite).toHaveLength(2);
    expect(resultSkip).toHaveLength(2);
  });

  it("既存データに存在しない incoming レコードは末尾に追加される", () => {
    const newLog: RoastLog = {
      ...SAMPLE_LOG,
      id: "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    };
    const result = mergeImport([newLog], existing, "skip");
    expect(result[result.length - 1].id).toBe(newLog.id);
  });
});
