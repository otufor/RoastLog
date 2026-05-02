import { describe, expect, it } from "vitest";
import { calcWeightLossRate, isCleanlinessWarning } from "@/domain/roastLog";

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
