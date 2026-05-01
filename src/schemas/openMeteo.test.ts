import { describe, expect, it } from "vitest";
import { OpenMeteoResponseSchema } from "@/schemas/openMeteo";

describe("OpenMeteoResponseSchema", () => {
  it("有効なレスポンスを受け入れる", () => {
    expect(
      OpenMeteoResponseSchema.safeParse({
        current: {
          temperature_2m: 20.5,
          relative_humidity_2m: 55,
          weather_code: 0,
        },
      }).success,
    ).toBe(true);
  });

  it("current が欠けているとき失敗する", () => {
    expect(OpenMeteoResponseSchema.safeParse({}).success).toBe(false);
  });

  it("humidity が 100 超のとき失敗する", () => {
    expect(
      OpenMeteoResponseSchema.safeParse({
        current: {
          temperature_2m: 20,
          relative_humidity_2m: 101,
          weather_code: 0,
        },
      }).success,
    ).toBe(false);
  });

  it("humidity が負数のとき失敗する", () => {
    expect(
      OpenMeteoResponseSchema.safeParse({
        current: {
          temperature_2m: 20,
          relative_humidity_2m: -1,
          weather_code: 0,
        },
      }).success,
    ).toBe(false);
  });
});
