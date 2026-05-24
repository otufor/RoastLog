import { describe, expect, it } from "vitest";
import { calcDiff } from "@/domain/calcDiff";
import type { RoastLog } from "@/schemas/roastLog";

const BASE: RoastLog = {
  id: "550e8400-e29b-41d4-a716-446655440010",
  beanId: "550e8400-e29b-41d4-a716-446655440001",
  roastDate: "2025-04-20",
  roastLevelId: "medium",
  roastDeviceId: null,
  roastDurationSec: 480,
  firstCrackSec: 300,
  secondCrackSec: 420,
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
};

describe("calcDiff", () => {
  it("両方のフィールドが揃っている場合 current - previous を返す", () => {
    const previous: RoastLog = {
      ...BASE,
      id: "550e8400-e29b-41d4-a716-446655440011",
      firstCrackSec: 280,
      secondCrackSec: 400,
      weightBeforeG: 250,
      weightAfterG: 215,
      outdoorTempC: 15,
      indoorTempC: 20,
      overallScore: 3,
    };
    const current: RoastLog = {
      ...BASE,
      firstCrackSec: 300,
      secondCrackSec: 420,
      weightBeforeG: 250,
      weightAfterG: 210,
      outdoorTempC: 18,
      indoorTempC: 22,
      overallScore: 4,
    };

    const diff = calcDiff(current, previous);

    expect(diff.firstCrackDiffSec).toBe(20);
    expect(diff.secondCrackDiffSec).toBe(20);
    // current 16% - previous 14% = 2pt
    expect(diff.weightLossRateDiffPct).toBeCloseTo(2);
    expect(diff.overallScoreDiff).toBe(1);
    expect(diff.outdoorTempDiff).toBe(3);
    expect(diff.indoorTempDiff).toBe(2);
  });

  it("current 側の nullable フィールドが null の場合は差分も null", () => {
    const previous: RoastLog = { ...BASE };
    const current: RoastLog = {
      ...BASE,
      firstCrackSec: null,
      secondCrackSec: null,
      outdoorTempC: null,
      indoorTempC: null,
      overallScore: null,
    };

    const diff = calcDiff(current, previous);

    expect(diff.firstCrackDiffSec).toBeNull();
    expect(diff.secondCrackDiffSec).toBeNull();
    expect(diff.outdoorTempDiff).toBeNull();
    expect(diff.indoorTempDiff).toBeNull();
    expect(diff.overallScoreDiff).toBeNull();
  });

  it("previous 側の nullable フィールドが null の場合も差分は null", () => {
    const previous: RoastLog = {
      ...BASE,
      firstCrackSec: null,
      secondCrackSec: null,
      outdoorTempC: null,
      indoorTempC: null,
      overallScore: null,
    };
    const current: RoastLog = { ...BASE };

    const diff = calcDiff(current, previous);

    expect(diff.firstCrackDiffSec).toBeNull();
    expect(diff.secondCrackDiffSec).toBeNull();
    expect(diff.outdoorTempDiff).toBeNull();
    expect(diff.indoorTempDiff).toBeNull();
    expect(diff.overallScoreDiff).toBeNull();
  });

  it("WeightLossRate は両方の重量から常に算出され差分は数値になる", () => {
    const previous: RoastLog = {
      ...BASE,
      weightBeforeG: 200,
      weightAfterG: 180,
    };
    const current: RoastLog = {
      ...BASE,
      weightBeforeG: 200,
      weightAfterG: 170,
    };

    const diff = calcDiff(current, previous);
    // current 15% - previous 10% = 5pt
    expect(diff.weightLossRateDiffPct).toBeCloseTo(5);
  });

  it("current の重量が null の場合、WeightLossRate 差分は null", () => {
    const previous: RoastLog = { ...BASE };
    const current: RoastLog = {
      ...BASE,
      weightBeforeG: null,
      weightAfterG: null,
    };

    const diff = calcDiff(current, previous);
    expect(diff.weightLossRateDiffPct).toBeNull();
  });

  it("差分が負になる場合（current < previous）は負の値を返す", () => {
    const previous: RoastLog = { ...BASE, firstCrackSec: 320 };
    const current: RoastLog = { ...BASE, firstCrackSec: 300 };

    const diff = calcDiff(current, previous);
    expect(diff.firstCrackDiffSec).toBe(-20);
  });
});
