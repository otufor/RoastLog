import { describe, expect, it } from "vitest";
import {
  FlavorTagSchema,
  RoastDeviceSchema,
  RoastLevelSchema,
} from "@/schemas/masterData";

describe("RoastLevelSchema", () => {
  it("有効な RoastLevel を受け入れる", () => {
    expect(
      RoastLevelSchema.safeParse({
        id: "light",
        label: "浅煎り",
        color: "#F5C842",
        order: 0,
      }).success,
    ).toBe(true);
  });

  it("color が hex でないとき失敗する", () => {
    expect(
      RoastLevelSchema.safeParse({
        id: "light",
        label: "浅煎り",
        color: "yellow",
        order: 0,
      }).success,
    ).toBe(false);
  });

  it("order が負数のとき失敗する", () => {
    expect(
      RoastLevelSchema.safeParse({
        id: "light",
        label: "浅煎り",
        color: "#F5C842",
        order: -1,
      }).success,
    ).toBe(false);
  });
});

describe("FlavorTagSchema", () => {
  it("有効な FlavorTag を受け入れる", () => {
    expect(
      FlavorTagSchema.safeParse({
        id: "floral",
        name: "フローラル",
        color: "#FF69B4",
      }).success,
    ).toBe(true);
  });

  it("name が空文字のとき失敗する", () => {
    expect(
      FlavorTagSchema.safeParse({ id: "floral", name: "", color: "#FF69B4" })
        .success,
    ).toBe(false);
  });
});

describe("RoastDeviceSchema", () => {
  it("有効な RoastDevice を受け入れる", () => {
    expect(
      RoastDeviceSchema.safeParse({
        id: "weroast",
        name: "weroast HOME ROASTER",
        method: "直火式",
        note: "",
      }).success,
    ).toBe(true);
  });
});
