import { describe, expect, it } from "vitest";
import { BeanSchema } from "@/schemas/bean";

const validBean = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "エチオピア イルガチェフェ",
  origin: "エチオピア",
  productName: "イルガチェフェ G1 ナチュラル 2023クロップ",
  shopName: "丸山珈琲",
  purchasedAt: "2024-01-15",
  importedAt: null,
  stockG: 500,
  bestLogId: null,
  note: "",
};

describe("BeanSchema", () => {
  it("有効な Bean を受け入れる", () => {
    expect(BeanSchema.safeParse(validBean).success).toBe(true);
  });

  it("stockG がマイナスでも受け入れる（在庫ズレは正常運用）", () => {
    expect(BeanSchema.safeParse({ ...validBean, stockG: -100 }).success).toBe(
      true,
    );
  });

  it("name が空文字のとき失敗する", () => {
    expect(BeanSchema.safeParse({ ...validBean, name: "" }).success).toBe(
      false,
    );
  });

  it("id が UUID でないとき失敗する", () => {
    expect(
      BeanSchema.safeParse({ ...validBean, id: "not-a-uuid" }).success,
    ).toBe(false);
  });

  it("bestLogId が null でも有効", () => {
    expect(
      BeanSchema.safeParse({ ...validBean, bestLogId: null }).success,
    ).toBe(true);
  });

  it("bestLogId が UUID 文字列のとき有効", () => {
    const withBestLog = {
      ...validBean,
      bestLogId: "550e8400-e29b-41d4-a716-446655440001",
    };
    expect(BeanSchema.safeParse(withBestLog).success).toBe(true);
  });
});
