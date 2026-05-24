import { describe, expect, it } from "vitest";
import type { Bean } from "@/schemas/bean";
import type { RoastLog, Tasting } from "@/schemas/roastLog";
import {
  buildLineChartData,
  buildRadarChartData,
  logsWithTasting,
  selectDefaultLog,
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

  it("重量が null のログはチャートデータから除外される", () => {
    const withWeight = makeLog({
      roastDate: "2025-01-01",
      weightBeforeG: 250,
      weightAfterG: 210,
    });
    const noWeight = makeLog({
      roastDate: "2025-02-01",
      weightBeforeG: null,
      weightAfterG: null,
    });
    const result = buildLineChartData([withWeight, noWeight]);
    expect(result[0].data).toHaveLength(1);
    expect(result[0].data[0].x).toBe(1);
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

const makeBean = (overrides: Partial<Bean> = {}): Bean => ({
  id: "bean-1",
  name: "エチオピア",
  origin: "エチオピア",
  productName: "",
  shopName: "",
  purchasedAt: null,
  importedAt: null,
  stockG: 500,
  bestLogId: null,
  note: "",
  totalG: 0,
  flavorTagIds: [],
  process: "",
  region: "",
  altitude: "",
  variety: "",
  ...overrides,
});

describe("selectDefaultLog", () => {
  it("bean が null なら null を返す", () => {
    expect(selectDefaultLog(null, [])).toBeNull();
  });

  it("ログが0件なら null を返す", () => {
    expect(selectDefaultLog(makeBean(), [])).toBeNull();
  });

  it("Tasting がないログしかなければ null を返す", () => {
    const log = makeLog({ tasting: null });
    expect(selectDefaultLog(makeBean(), [log])).toBeNull();
  });

  it("bestLogId なしなら Tasting ありの最新ログを返す", () => {
    const old = makeLog({
      id: "old",
      roastDate: "2025-01-01",
      tasting: TASTING,
    });
    const newer = makeLog({
      id: "new",
      roastDate: "2025-06-01",
      tasting: TASTING,
    });
    expect(selectDefaultLog(makeBean(), [old, newer])).toBe("new");
  });

  it("bestLogId が Tasting ありなら BestRecipe を返す", () => {
    const best = makeLog({
      id: "best",
      roastDate: "2025-01-01",
      tasting: TASTING,
    });
    const newer = makeLog({
      id: "new",
      roastDate: "2025-06-01",
      tasting: TASTING,
    });
    const bean = makeBean({ bestLogId: "best" });
    expect(selectDefaultLog(bean, [best, newer])).toBe("best");
  });

  it("bestLogId が Tasting なしなら最新の Tasting ありログを返す", () => {
    const best = makeLog({
      id: "best",
      roastDate: "2025-01-01",
      tasting: null,
    });
    const newer = makeLog({
      id: "new",
      roastDate: "2025-06-01",
      tasting: TASTING,
    });
    const bean = makeBean({ bestLogId: "best" });
    expect(selectDefaultLog(bean, [best, newer])).toBe("new");
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
