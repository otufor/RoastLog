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

  it("不正な日付文字列は null を返す", () => {
    expect(
      monthsSincePurchase("not-a-date", new Date("2026-05-02")),
    ).toBeNull();
  });
});
