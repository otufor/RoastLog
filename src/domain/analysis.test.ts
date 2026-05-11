import { describe, expect, it } from "vitest";
import type { RoastLog, Tasting } from "@/schemas/roastLog";
import {
  buildLineChartData,
  buildRadarChartData,
  logsWithTasting,
} from "./analysis";

const makeLog = (overrides: Partial<RoastLog> = {}): RoastLog => ({
  id: crypto.randomUUID(),
  beanId: "bean-1",
  roastDate: "2025-01-01",
  roastLevelId: "medium",
  roastDeviceId: null,
  roastDurationSec: 480,
  firstCrackSec: 300,
  secondCrackSec: null,
  weightBeforeG: 250,
  weightAfterG: 210,
  outdoorTempC: 18,
  outdoorHumidity: 60,
  indoorTempC: 22,
  tempSource: "auto",
  weatherCode: 0,
  tasting: null,
  overallScore: 4,
  processNote: "",
  ...overrides,
});

const TASTING: Tasting = {
  flavorTags: [],
  sweetness: 4,
  acidity: 3,
  body: 3,
  bitterness: 2,
  aftertaste: 4,
  cleanliness: 5,
};

describe("buildLineChartData", () => {
  it("ログなし → WeightLossRate の1系列のみ、data が空", () => {
    const result = buildLineChartData([]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("WeightLossRate");
    expect(result[0].data).toHaveLength(0);
  });

  it("1件 → WeightLossRate が正しく計算される", () => {
    // (1 - 210/250) * 100 = 16.0
    const result = buildLineChartData([makeLog()]);
    const [wlr] = result;
    expect(wlr.data).toHaveLength(1);
    expect(wlr.data[0].x).toBe(1);
    expect(wlr.data[0].y).toBeCloseTo(16, 5);
  });

  it("複数ログが roastDate 昇順で x=1,2,3 に並ぶ", () => {
    const logs = [
      makeLog({
        roastDate: "2025-03-01",
        weightBeforeG: 200,
        weightAfterG: 160,
      }),
      makeLog({
        roastDate: "2025-01-01",
        weightBeforeG: 250,
        weightAfterG: 210,
      }),
      makeLog({
        roastDate: "2025-02-01",
        weightBeforeG: 300,
        weightAfterG: 240,
      }),
    ];
    const result = buildLineChartData(logs);
    const [wlr] = result;
    // 昇順: Jan(16%), Feb(20%), Mar(20%)
    expect(wlr.data[0].x).toBe(1);
    expect(wlr.data[1].x).toBe(2);
    expect(wlr.data[2].x).toBe(3);
    expect((wlr.data[0].y as number).toFixed(1)).toBe("16.0");
    expect((wlr.data[1].y as number).toFixed(1)).toBe("20.0");
    expect((wlr.data[2].y as number).toFixed(1)).toBe("20.0");
  });
});

describe("logsWithTasting", () => {
  it("Tasting なしのログを除外する", () => {
    const withTasting = makeLog({ tasting: TASTING });
    const withoutTasting = makeLog({ tasting: null });
    expect(logsWithTasting([withTasting, withoutTasting])).toEqual([
      withTasting,
    ]);
  });

  it("全件 Tasting あり → 全件返す", () => {
    const logs = [makeLog({ tasting: TASTING }), makeLog({ tasting: TASTING })];
    expect(logsWithTasting(logs)).toHaveLength(2);
  });
});

describe("buildRadarChartData", () => {
  it("1エントリ → 6軸それぞれ正しい値を持つ行が返る", () => {
    const result = buildRadarChartData([
      { label: "BestRecipe", tasting: TASTING },
    ]);
    expect(result).toHaveLength(6);
    const metrics = result.map((r) => r.metric);
    expect(metrics).toEqual([
      "sweetness",
      "acidity",
      "body",
      "bitterness",
      "aftertaste",
      "cleanliness",
    ]);
    const sweetnessRow = result.find((r) => r.metric === "sweetness");
    expect(sweetnessRow).toBeDefined();
    expect(sweetnessRow).toMatchObject({ BestRecipe: 4 });
  });

  it("複数エントリ → 同一行に各ラベルのスコアが並列展開される", () => {
    const result = buildRadarChartData([
      { label: "BestRecipe", tasting: TASTING },
      { label: "Log2", tasting: { ...TASTING, sweetness: 2 } },
    ]);
    const sweetnessRow = result.find((r) => r.metric === "sweetness");
    expect(sweetnessRow).toBeDefined();
    expect(sweetnessRow).toMatchObject({ BestRecipe: 4, Log2: 2 });
  });
});
