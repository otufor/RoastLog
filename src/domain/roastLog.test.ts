import { describe, expect, it } from "vitest";
import {
  calcWeightLossRate,
  filterAndSortLogs,
  isCleanlinessWarning,
} from "@/domain/roastLog";
import type { RoastLog } from "@/schemas/roastLog";

const makeLog = (overrides: Partial<RoastLog> = {}): RoastLog => ({
  id: crypto.randomUUID(),
  beanId: "bean-1",
  roastDate: "2025-04-20",
  roastLevelId: "medium",
  roastDeviceId: null,
  roastDurationSec: 480,
  firstCrackSec: 300,
  secondCrackSec: null,
  weightBeforeG: 250,
  weightAfterG: 210,
  outdoorTempC: null,
  outdoorHumidity: null,
  indoorTempC: null,
  tempSource: "auto",
  weatherCode: null,
  tasting: null,
  overallScore: 3,
  processNote: "",
  ...overrides,
});

describe("filterAndSortLogs", () => {
  it("フィルターなし・デフォルトソートで roastDate 降順に並ぶ", () => {
    const logOld = makeLog({ roastDate: "2025-04-01" });
    const logNew = makeLog({ roastDate: "2025-04-20" });
    const result = filterAndSortLogs([logOld, logNew], {}, "roastDate", "desc");
    expect(result.map((l) => l.roastDate)).toEqual([
      "2025-04-20",
      "2025-04-01",
    ]);
  });

  it("beanId フィルターで対象豆のみ返す", () => {
    const logA = makeLog({ beanId: "bean-A" });
    const logB = makeLog({ beanId: "bean-B" });
    const result = filterAndSortLogs(
      [logA, logB],
      { beanId: "bean-A" },
      "roastDate",
      "desc",
    );
    expect(result).toHaveLength(1);
    expect(result[0].beanId).toBe("bean-A");
  });

  it("roastLevelId フィルターで対象レベルのみ返す", () => {
    const logLight = makeLog({ roastLevelId: "light" });
    const logMedium = makeLog({ roastLevelId: "medium" });
    const result = filterAndSortLogs(
      [logLight, logMedium],
      { roastLevelId: "light" },
      "roastDate",
      "desc",
    );
    expect(result).toHaveLength(1);
    expect(result[0].roastLevelId).toBe("light");
  });

  it("roastDeviceId フィルターで対象デバイスのみ返す", () => {
    const logA = makeLog({ roastDeviceId: "device-1" });
    const logB = makeLog({ roastDeviceId: null });
    const result = filterAndSortLogs(
      [logA, logB],
      { roastDeviceId: "device-1" },
      "roastDate",
      "desc",
    );
    expect(result).toHaveLength(1);
    expect(result[0].roastDeviceId).toBe("device-1");
  });

  it("scoreMin で最低スコア以上のみ返す", () => {
    const log3 = makeLog({ overallScore: 3 });
    const log5 = makeLog({ overallScore: 5 });
    const logNull = makeLog({ overallScore: null });
    const result = filterAndSortLogs(
      [log3, log5, logNull],
      { scoreMin: 4 },
      "roastDate",
      "desc",
    );
    expect(result).toHaveLength(1);
    expect(result[0].overallScore).toBe(5);
  });

  it("scoreMax で最高スコア以下のみ返す", () => {
    const log2 = makeLog({ overallScore: 2 });
    const log4 = makeLog({ overallScore: 4 });
    const result = filterAndSortLogs(
      [log2, log4],
      { scoreMax: 3 },
      "roastDate",
      "desc",
    );
    expect(result).toHaveLength(1);
    expect(result[0].overallScore).toBe(2);
  });

  it("dateFrom で指定日以降のみ返す", () => {
    const logOld = makeLog({ roastDate: "2025-03-01" });
    const logNew = makeLog({ roastDate: "2025-04-01" });
    const result = filterAndSortLogs(
      [logOld, logNew],
      { dateFrom: "2025-04-01" },
      "roastDate",
      "desc",
    );
    expect(result).toHaveLength(1);
    expect(result[0].roastDate).toBe("2025-04-01");
  });

  it("dateTo で指定日以前のみ返す", () => {
    const logOld = makeLog({ roastDate: "2025-03-01" });
    const logNew = makeLog({ roastDate: "2025-04-01" });
    const result = filterAndSortLogs(
      [logOld, logNew],
      { dateTo: "2025-03-31" },
      "roastDate",
      "desc",
    );
    expect(result).toHaveLength(1);
    expect(result[0].roastDate).toBe("2025-03-01");
  });

  it("roastDate 昇順ソートで古い順に並ぶ", () => {
    const logOld = makeLog({ roastDate: "2025-04-01" });
    const logNew = makeLog({ roastDate: "2025-04-20" });
    const result = filterAndSortLogs([logNew, logOld], {}, "roastDate", "asc");
    expect(result.map((l) => l.roastDate)).toEqual([
      "2025-04-01",
      "2025-04-20",
    ]);
  });

  it("overallScore 降順ソートで高スコア順に並ぶ", () => {
    const log3 = makeLog({ overallScore: 3 });
    const log5 = makeLog({ overallScore: 5 });
    const log1 = makeLog({ overallScore: 1 });
    const result = filterAndSortLogs(
      [log3, log5, log1],
      {},
      "overallScore",
      "desc",
    );
    expect(result.map((l) => l.overallScore)).toEqual([5, 3, 1]);
  });

  it("weightLossRate 降順ソートで高減少率順に並ぶ", () => {
    // 250→200 = 20%, 250→225 = 10%
    const logHigh = makeLog({ weightBeforeG: 250, weightAfterG: 200 });
    const logLow = makeLog({ weightBeforeG: 250, weightAfterG: 225 });
    const result = filterAndSortLogs(
      [logLow, logHigh],
      {},
      "weightLossRate",
      "desc",
    );
    expect(result[0]).toBe(logHigh);
    expect(result[1]).toBe(logLow);
  });

  it("フィルターとソートを組み合わせる", () => {
    const logA = makeLog({
      beanId: "bean-A",
      overallScore: 5,
      roastDate: "2025-04-01",
    });
    const logB = makeLog({
      beanId: "bean-A",
      overallScore: 3,
      roastDate: "2025-04-20",
    });
    const logC = makeLog({
      beanId: "bean-B",
      overallScore: 4,
      roastDate: "2025-04-10",
    });
    const result = filterAndSortLogs(
      [logA, logB, logC],
      { beanId: "bean-A" },
      "overallScore",
      "desc",
    );
    expect(result).toHaveLength(2);
    expect(result.map((l) => l.overallScore)).toEqual([5, 3]);
  });
});

describe("calcWeightLossRate", () => {
  it("標準バッチの重量減少率を計算する", () => {
    // 250g → 210g: (1 - 210/250) × 100 = 16%
    expect(calcWeightLossRate(250, 210)).toBeCloseTo(16);
  });

  it("重量が同じなら 0 を返す", () => {
    expect(calcWeightLossRate(100, 100)).toBe(0);
  });

  it("焙煎前重量が 0 以下なら 0 を返す", () => {
    expect(calcWeightLossRate(0, 0)).toBe(0);
  });
});

describe("isCleanlinessWarning", () => {
  it("cleanliness が 2 のとき true（境界値）", () => {
    expect(isCleanlinessWarning(2)).toBe(true);
  });

  it("cleanliness が 1 のとき true", () => {
    expect(isCleanlinessWarning(1)).toBe(true);
  });

  it("cleanliness が 3 のとき false", () => {
    expect(isCleanlinessWarning(3)).toBe(false);
  });
});
