import { describe, expect, it } from "vitest";
import { weatherEmoji } from "@/lib/weatherEmoji";

describe("weatherEmoji", () => {
  it("0 (快晴) を ☀️ に変換する", () => {
    expect(weatherEmoji(0)).toBe("☀️");
  });

  it("3 (曇り) を ☁️ に変換する", () => {
    expect(weatherEmoji(3)).toBe("☁️");
  });

  it("45 (霧) を 🌫️ に変換する", () => {
    expect(weatherEmoji(45)).toBe("🌫️");
  });

  it("63 (雨: 中程度) を 🌧️ に変換する", () => {
    expect(weatherEmoji(63)).toBe("🌧️");
  });

  it("73 (雪: 中程度) を 🌨️ に変換する", () => {
    expect(weatherEmoji(73)).toBe("🌨️");
  });

  it("95 (雷雨) を ⛈️ に変換する", () => {
    expect(weatherEmoji(95)).toBe("⛈️");
  });

  it("未定義の WMO コードは空文字を返す", () => {
    expect(weatherEmoji(999)).toBe("");
  });

  it("null の場合は空文字を返す", () => {
    expect(weatherEmoji(null)).toBe("");
  });

  it("undefined の場合は空文字を返す", () => {
    expect(weatherEmoji(undefined)).toBe("");
  });
});
