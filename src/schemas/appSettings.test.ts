import { describe, expect, it } from "vitest";
import { AppSettingsSchema, DEFAULT_APP_SETTINGS } from "@/schemas/appSettings";

describe("AppSettingsSchema", () => {
  it("有効な設定を受け入れる", () => {
    expect(
      AppSettingsSchema.safeParse({
        locationLat: 36.0641,
        locationLon: 136.2196,
        locationLabel: "自宅（福井）",
      }).success,
    ).toBe(true);
  });

  it("緯度経度が null でも有効", () => {
    expect(AppSettingsSchema.safeParse(DEFAULT_APP_SETTINGS).success).toBe(
      true,
    );
  });

  it("緯度が範囲外（91）のとき失敗する", () => {
    expect(
      AppSettingsSchema.safeParse({
        locationLat: 91,
        locationLon: 0,
        locationLabel: "",
      }).success,
    ).toBe(false);
  });

  it("経度が範囲外（-181）のとき失敗する", () => {
    expect(
      AppSettingsSchema.safeParse({
        locationLat: 0,
        locationLon: -181,
        locationLabel: "",
      }).success,
    ).toBe(false);
  });
});
