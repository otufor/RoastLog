import { render, screen } from "@testing-library/react/pure";
import { describe, expect, it } from "vitest";
import { DiffSummary } from "@/components/DiffSummary";
import type { RoastLog } from "@/schemas/roastLog";

const BASE: RoastLog = {
  id: "550e8400-e29b-41d4-a716-446655440010",
  beanId: "550e8400-e29b-41d4-a716-446655440001",
  roastStartTime: "2025-04-20T00:00",
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

describe("DiffSummary", () => {
  it("差分項目をすべて表示する", () => {
    const previous: RoastLog = {
      ...BASE,
      id: "550e8400-e29b-41d4-a716-446655440011",
      roastStartTime: "2025-04-10T00:00",
      firstCrackSec: 280,
      secondCrackSec: 410,
      weightBeforeG: 250,
      weightAfterG: 215,
      outdoorTempC: 15,
      indoorTempC: 20,
      overallScore: 3,
    };

    render(<DiffSummary current={BASE} previous={previous} />);

    expect(screen.getByText("前回ログとの差分")).toBeInTheDocument();
    expect(screen.getByText("前回焙煎日: 2025-04-10")).toBeInTheDocument();
    expect(screen.getByText("+20秒")).toBeInTheDocument(); // 1ハゼ
    expect(screen.getByText("+10秒")).toBeInTheDocument(); // 2ハゼ
    expect(screen.getByText("+1")).toBeInTheDocument(); // 総合評価
    expect(screen.getByText("+3℃")).toBeInTheDocument(); // 外気温
    expect(screen.getByText("+2℃")).toBeInTheDocument(); // 室内気温
    expect(screen.getByText(/pt$/)).toBeInTheDocument(); // 重量減少率
  });

  it("nullable フィールドが null の場合「—」を表示する", () => {
    const previous: RoastLog = {
      ...BASE,
      id: "550e8400-e29b-41d4-a716-446655440011",
      firstCrackSec: null,
      secondCrackSec: null,
      outdoorTempC: null,
      indoorTempC: null,
      overallScore: null,
    };

    render(<DiffSummary current={BASE} previous={previous} />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(5);
  });
});
