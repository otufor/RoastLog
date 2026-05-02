import { describe, expect, it } from "vitest";
import { monthsSincePurchase } from "@/domain/bean";

describe("monthsSincePurchase", () => {
  it("purchasedAt が null なら null を返す", () => {
    expect(monthsSincePurchase(null, new Date("2026-05-02"))).toBeNull();
  });

  it("購入月と同じ月なら 0", () => {
    expect(monthsSincePurchase("2026-05-15", new Date("2026-05-02"))).toBe(0);
  });

  it("1 ヶ月後は 1", () => {
    expect(monthsSincePurchase("2026-04-15", new Date("2026-05-02"))).toBe(1);
  });

  it("年をまたぐ場合も月差で返す（13 ヶ月）", () => {
    expect(monthsSincePurchase("2025-04-15", new Date("2026-05-02"))).toBe(13);
  });

  it("月初日（01）でもタイムゾーンに依らず正しく月差を返す", () => {
    // 同月の月初日に購入 → 0 ヶ月
    expect(monthsSincePurchase("2026-05-01", new Date(2026, 4, 2))).toBe(0);
    // 前月の月初日に購入 → 1 ヶ月
    expect(monthsSincePurchase("2026-04-01", new Date(2026, 4, 2))).toBe(1);
  });

  it("不正な日付文字列は null を返す", () => {
    expect(
      monthsSincePurchase("not-a-date", new Date("2026-05-02")),
    ).toBeNull();
  });
});
