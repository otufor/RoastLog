import { describe, expect, it } from "vitest";
import { roastLogsToCSV } from "@/lib/csvExport";
import type { RoastLog } from "@/schemas/roastLog";

const BASE_LOG: RoastLog = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  beanId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  roastDate: "2024-01-15",
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

describe("roastLogsToCSV", () => {
  it("空配列はヘッダー行のみ返す", () => {
    const csv = roastLogsToCSV([]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("id");
    expect(lines[0]).toContain("beanId");
    expect(lines[0]).toContain("roastDate");
  });

  it("ヘッダーに全フィールドが含まれる", () => {
    const csv = roastLogsToCSV([]);
    const headers = csv.split("\n")[0].split(",");
    const expected = [
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
    expect(headers).toEqual(expected);
  });

  it("RoastLog 1件を正しくシリアライズする", () => {
    const csv = roastLogsToCSV([BASE_LOG]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    const row = lines[1].split(",");
    expect(row[0]).toBe("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    expect(row[2]).toBe("2024-01-15");
    expect(row[5]).toBe("720");
    expect(row[9]).toBe("170");
  });

  it("null フィールドは空文字列になる", () => {
    const csv = roastLogsToCSV([BASE_LOG]);
    const row = csv.split("\n")[1].split(",");
    const headers = csv.split("\n")[0].split(",");
    const roastDeviceIdx = headers.indexOf("roastDeviceId");
    const secondCrackIdx = headers.indexOf("secondCrackSec");
    const indoorTempIdx = headers.indexOf("indoorTempC");
    expect(row[roastDeviceIdx]).toBe("");
    expect(row[secondCrackIdx]).toBe("");
    expect(row[indoorTempIdx]).toBe("");
  });

  it("tasting が null の場合は全 tasting_ フィールドが空文字列", () => {
    const log: RoastLog = { ...BASE_LOG, tasting: null };
    const csv = roastLogsToCSV([log]);
    const headers = csv.split("\n")[0].split(",");
    const row = csv.split("\n")[1].split(",");
    for (const h of headers.filter((h) => h.startsWith("tasting_"))) {
      expect(row[headers.indexOf(h)]).toBe("");
    }
  });

  it("flavorTags は CSV エスケープされた JSON 文字列でシリアライズされる", () => {
    const csv = roastLogsToCSV([BASE_LOG]);
    expect(csv).toContain('"[""fruity"",""chocolate""]"');
  });

  it("processNote にカンマが含まれる場合はダブルクォートでエスケープされる", () => {
    const log: RoastLog = { ...BASE_LOG, processNote: "熱い,良い感じ" };
    const csv = roastLogsToCSV([log]);
    expect(csv).toContain('"熱い,良い感じ"');
  });

  it("複数件を正しく出力する", () => {
    const log2: RoastLog = {
      ...BASE_LOG,
      id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    };
    const csv = roastLogsToCSV([BASE_LOG, log2]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
  });
});
