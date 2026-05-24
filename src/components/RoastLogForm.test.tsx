import { render, screen, waitFor } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RoastLogForm } from "@/components/RoastLogForm";
import type { Bean } from "@/schemas/bean";
import type { RoastDevice, RoastLevel } from "@/schemas/masterData";
import type { CreateRoastLogInput } from "@/schemas/roastLog";

const BEAN: Bean = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  name: "エチオピア イルガチェフェ",
  origin: "エチオピア",
  productName: "",
  shopName: "",
  purchasedAt: null,
  importedAt: null,
  stockG: 500,
  bestLogId: null,
  note: "",
  totalG: 0,
  flavorTagIds: [],
  process: "",
  region: "",
  altitude: "",
  variety: "",
};

const LEVEL: RoastLevel = {
  id: "medium",
  label: "中煎り",
  color: "#B06B1E",
  order: 3,
};

const DEVICE: RoastDevice = {
  id: "device-1",
  name: "手網",
  method: "",
  note: "",
};

const DEFAULTS: CreateRoastLogInput = {
  beanId: BEAN.id,
  roastStartTime: "2025-04-20T00:00",
  roastLevelId: LEVEL.id,
  roastDeviceId: null,
  roastDurationSec: 480,
  firstCrackSec: 300,
  secondCrackSec: null,
  weightBeforeG: 250,
  weightAfterG: 210,
  outdoorTempC: null,
  outdoorHumidity: null,
  indoorTempC: null,
  tempSource: "manual",
  weatherCode: null,
  tasting: null,
  overallScore: null,
  processNote: "",
};

function renderForm(
  overrides: Partial<CreateRoastLogInput> = {},
  onSubmit = vi.fn(),
) {
  render(
    <RoastLogForm
      defaultValues={{ ...DEFAULTS, ...overrides }}
      beans={[BEAN]}
      roastLevels={[LEVEL]}
      roastDevices={[DEVICE]}
      flavorTags={[]}
      submitLabel="登録"
      onSubmit={onSubmit}
    />,
  );
}

describe("RoastLogForm", () => {
  it("WeightLossRate を初期値から計算して表示する (250g→210g = 16.0%)", () => {
    renderForm();
    expect(screen.getByText(/16\.0%/)).toBeInTheDocument();
  });

  it("weightAfterG を変更すると WeightLossRate がリアルタイム更新される", async () => {
    renderForm();
    const input = screen.getByLabelText("焙煎後重量 (g)");
    await userEvent.clear(input);
    await userEvent.type(input, "200");
    await waitFor(() => expect(screen.getByText(/20\.0%/)).toBeInTheDocument());
  });

  it("有効なデータで送信すると onSubmit が呼ばれる", async () => {
    const onSubmit = vi.fn();
    renderForm({}, onSubmit);
    await userEvent.click(screen.getByRole("button", { name: "登録" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ beanId: BEAN.id, weightBeforeG: 250 }),
    );
  });

  it("weightBeforeG が 0 のとき送信エラーを表示する", async () => {
    renderForm({ weightBeforeG: 0 });
    await userEvent.click(screen.getByRole("button", { name: "登録" }));
    await waitFor(() =>
      expect(screen.getByText(/焙煎前重量は0より大きい/)).toBeInTheDocument(),
    );
  });
});
