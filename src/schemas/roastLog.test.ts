import { describe, expect, it } from "vitest";
import { RoastLogSchema, TastingSchema } from "@/schemas/roastLog";

const validTasting = {
  flavorTags: ["tag-1", "tag-2"],
  sweetness: 4,
  acidity: 3,
  body: 3,
  bitterness: 2,
  aftertaste: 4,
  cleanliness: 3,
};

const validRoastLog = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  beanId: "550e8400-e29b-41d4-a716-446655440001",
  roastDate: "2024-03-20",
  roastLevelId: "level-medium",
  roastDeviceId: null,
  roastDurationSec: 480,
  firstCrackSec: 300,
  secondCrackSec: null,
  weightBeforeG: 250,
  weightAfterG: 210,
  outdoorTempC: 18,
  outdoorHumidity: 60,
  indoorTempC: 22,
  tempSource: "auto" as const,
  weatherCode: 0,
  tasting: validTasting,
  overallScore: 4,
  processNote: "ハゼが予想より早かった",
};

describe("TastingSchema", () => {
  it("有効な Tasting を受け入れる", () => {
    expect(TastingSchema.safeParse(validTasting).success).toBe(true);
  });

  it("cleanliness が 1（下限境界値）で有効", () => {
    expect(
      TastingSchema.safeParse({ ...validTasting, cleanliness: 1 }).success,
    ).toBe(true);
  });

  it("cleanliness が 5（上限境界値）で有効", () => {
    expect(
      TastingSchema.safeParse({ ...validTasting, cleanliness: 5 }).success,
    ).toBe(true);
  });

  it("cleanliness が 0 のとき失敗する", () => {
    expect(
      TastingSchema.safeParse({ ...validTasting, cleanliness: 0 }).success,
    ).toBe(false);
  });

  it("cleanliness が 6 のとき失敗する", () => {
    expect(
      TastingSchema.safeParse({ ...validTasting, cleanliness: 6 }).success,
    ).toBe(false);
  });

  it("cleanliness が小数のとき失敗する", () => {
    expect(
      TastingSchema.safeParse({ ...validTasting, cleanliness: 3.5 }).success,
    ).toBe(false);
  });
});

describe("RoastLogSchema", () => {
  it("有効な RoastLog を受け入れる", () => {
    expect(RoastLogSchema.safeParse(validRoastLog).success).toBe(true);
  });

  it("tasting が null でも有効", () => {
    expect(
      RoastLogSchema.safeParse({ ...validRoastLog, tasting: null }).success,
    ).toBe(true);
  });

  it("overallScore が null でも有効", () => {
    expect(
      RoastLogSchema.safeParse({ ...validRoastLog, overallScore: null })
        .success,
    ).toBe(true);
  });

  it("weightBeforeG が 0 以下のとき失敗する", () => {
    expect(
      RoastLogSchema.safeParse({ ...validRoastLog, weightBeforeG: 0 }).success,
    ).toBe(false);
  });

  it("tempSource が不正な値のとき失敗する", () => {
    expect(
      RoastLogSchema.safeParse({ ...validRoastLog, tempSource: "unknown" })
        .success,
    ).toBe(false);
  });

  it("roastDurationSec が負数のとき失敗する", () => {
    expect(
      RoastLogSchema.safeParse({ ...validRoastLog, roastDurationSec: -1 })
        .success,
    ).toBe(false);
  });

  it("outdoorHumidity が 100 超のとき失敗する", () => {
    expect(
      RoastLogSchema.safeParse({ ...validRoastLog, outdoorHumidity: 101 })
        .success,
    ).toBe(false);
  });
});
