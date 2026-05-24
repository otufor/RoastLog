import { describe, expect, it } from "vitest";
import { buildTasting, validateTastingAxes } from "@/domain/tasting";

describe("validateTastingAxes", () => {
  it("全軸 null はテイスティングなしとして有効", () => {
    expect(validateTastingAxes([null, null, null, null, null, null])).toBe(
      true,
    );
  });

  it("全軸入力済みは有効", () => {
    expect(validateTastingAxes([3, 4, 2, 5, 1, 3])).toBe(true);
  });

  it("一部だけ入力は不変条件違反", () => {
    expect(validateTastingAxes([3, null, null, null, null, null])).toBe(false);
    expect(validateTastingAxes([3, 4, 2, null, null, null])).toBe(false);
    expect(validateTastingAxes([3, 4, 2, 5, 1, null])).toBe(false);
  });
});

describe("buildTasting", () => {
  it("全軸が揃っていれば Tasting を返す", () => {
    const result = buildTasting([], 3, 4, 2, 5, 1, 3);
    expect(result).toEqual({
      flavorTags: [],
      sweetness: 3,
      acidity: 4,
      body: 2,
      bitterness: 5,
      aftertaste: 1,
      cleanliness: 3,
    });
  });

  it("flavorTagIds を Tasting に含める", () => {
    const tags = ["tag-a", "tag-b"];
    const result = buildTasting(tags, 3, 4, 2, 5, 1, 3);
    expect(result?.flavorTags).toEqual(tags);
  });

  it("どれか1軸でも null なら null を返す", () => {
    expect(buildTasting([], null, 4, 2, 5, 1, 3)).toBeNull();
    expect(buildTasting([], 3, null, 2, 5, 1, 3)).toBeNull();
    expect(buildTasting([], 3, 4, 2, 5, 1, null)).toBeNull();
  });

  it("全軸 null なら null を返す", () => {
    expect(buildTasting([], null, null, null, null, null, null)).toBeNull();
  });
});
