import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { AnalysisPage } from "@/components/AnalysisPage";
import { db } from "@/db";
import type { Bean } from "@/schemas/bean";
import type { RoastLog, Tasting } from "@/schemas/roastLog";

const TASTING: Tasting = {
  flavorTags: [],
  sweetness: 4,
  acidity: 3,
  body: 3,
  bitterness: 2,
  aftertaste: 4,
  cleanliness: 5,
};

const BEAN: Bean = {
  id: crypto.randomUUID(),
  name: "エチオピア",
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

const makeLog = (overrides: Partial<RoastLog> = {}): RoastLog => ({
  id: crypto.randomUUID(),
  beanId: BEAN.id,
  roastDate: "2025-01-01",
  roastLevelId: "medium",
  roastDeviceId: null,
  roastDurationSec: 480,
  firstCrackSec: 300,
  secondCrackSec: null,
  weightBeforeG: 250,
  weightAfterG: 210,
  outdoorTempC: null,
  outdoorHumidity: null,
  indoorTempC: null,
  tempSource: "auto",
  weatherCode: null,
  tasting: null,
  overallScore: null,
  processNote: "",
  ...overrides,
});

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const route = createRoute({
    getParentRoute: () => rootRoute,
    path: "/analysis",
    component: AnalysisPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([route]),
    history: createMemoryHistory({ initialEntries: ["/analysis"] }),
  });
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("AnalysisPage", () => {
  beforeEach(async () => {
    await Promise.all([
      db.roastLevels.clear(),
      db.flavorTags.clear(),
      db.roastDevices.clear(),
      db.beans.clear(),
      db.roastLogs.clear(),
    ]);
  });

  it("豆セレクターが表示される", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /豆/ })).toBeInTheDocument(),
    );
  });

  it("豆未選択時、折れ線グラフが表示されない", async () => {
    await db.beans.put(BEAN);
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /豆/ })).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
  });

  it("BestRecipe 未設定時、レーダーのプレースホルダーが表示される", async () => {
    await db.beans.put(BEAN);
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/BestRecipe/)).toBeInTheDocument(),
    );
  });

  it("豆選択・ログ0件 → 「まだ焙煎ログがありません」が表示される", async () => {
    await db.beans.put(BEAN);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /豆/ })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("combobox", { name: /豆/ }));
    await user.click(await screen.findByRole("option", { name: BEAN.name }));
    await waitFor(() =>
      expect(screen.getByText("まだ焙煎ログがありません")).toBeInTheDocument(),
    );
  });

  it("豆選択・ログあり → 折れ線グラフが表示される", async () => {
    await db.beans.put(BEAN);
    await db.roastLogs.put(makeLog());
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /豆/ })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("combobox", { name: /豆/ }));
    await user.click(await screen.findByRole("option", { name: BEAN.name }));
    await waitFor(() =>
      expect(screen.getByTestId("line-chart")).toBeInTheDocument(),
    );
  });

  it("T5: Bean を切り替えると両セレクターがリセットされ新 Bean の BestRecipe がデフォルト選択される", async () => {
    const BEAN_B = { ...BEAN, id: crypto.randomUUID(), name: "ケニア ニエリ" };
    const logA = makeLog({
      beanId: BEAN.id,
      tasting: TASTING,
      roastDate: "2025-06-01",
    });
    const logB = makeLog({
      beanId: BEAN_B.id,
      tasting: { ...TASTING, sweetness: 1 },
      roastDate: "2025-05-01",
    });
    await db.beans.put({ ...BEAN, bestLogId: logA.id });
    await db.beans.put({ ...BEAN_B, bestLogId: logB.id });
    await db.roastLogs.put(logA);
    await db.roastLogs.put(logB);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /豆/ })).toBeInTheDocument(),
    );
    // Select BEAN_A → radar shows (bestRecipe = logA)
    await user.click(screen.getByRole("combobox", { name: /豆/ }));
    await user.click(await screen.findByRole("option", { name: BEAN.name }));
    await waitFor(() =>
      expect(screen.getByTestId("radar-chart")).toBeInTheDocument(),
    );
    // Switch to BEAN_B → logA card disappears, logB auto-selected
    await user.click(screen.getByRole("combobox", { name: /豆/ }));
    await user.click(await screen.findByRole("option", { name: BEAN_B.name }));
    // logA card no longer visible
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /2025-06-01/ }),
      ).not.toBeInTheDocument(),
    );
    // logB card visible and radar shows
    expect(
      screen.getByRole("button", { name: /2025-05-01/ }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("radar-chart")).toBeInTheDocument();
  });

  it("T4: 2枚目カードを選択するとスロット2に入り、選択済みカードをクリックすると解除される", async () => {
    const logA = makeLog({ tasting: TASTING, roastDate: "2025-06-01" });
    const logB = makeLog({
      tasting: { ...TASTING, sweetness: 2 },
      roastDate: "2025-05-01",
    });
    await db.beans.put({ ...BEAN, bestLogId: logA.id });
    await db.roastLogs.put(logA);
    await db.roastLogs.put(logB);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /豆/ })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("combobox", { name: /豆/ }));
    await user.click(await screen.findByRole("option", { name: BEAN.name }));
    // Slot1 = logA (BestRecipe auto). Radar already shows.
    await waitFor(() =>
      expect(screen.getByTestId("radar-chart")).toBeInTheDocument(),
    );
    // Click logB → slot2
    const cardB = await screen.findByRole("button", { name: /2025-05-01/ });
    await user.click(cardB);
    // Radar still shows
    expect(screen.getByTestId("radar-chart")).toBeInTheDocument();
    // Click logA to deselect slot1
    const cardA = screen.getByRole("button", { name: /2025-06-01/ });
    await user.click(cardA);
    // Radar still shows (logB remains in slot2)
    expect(screen.getByTestId("radar-chart")).toBeInTheDocument();
  });

  it("T3: BestRecipe ありの Bean を選択すると自動でレーダーチャートが表示される", async () => {
    const log = makeLog({ tasting: TASTING, roastDate: "2025-06-01" });
    await db.beans.put({ ...BEAN, bestLogId: log.id });
    await db.roastLogs.put(log);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /豆/ })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("combobox", { name: /豆/ }));
    await user.click(await screen.findByRole("option", { name: BEAN.name }));
    await waitFor(() =>
      expect(screen.getByTestId("radar-chart")).toBeInTheDocument(),
    );
  });

  it("T2: Tasting なしカードをクリックしても選択状態にならない", async () => {
    await db.beans.put(BEAN);
    await db.roastLogs.put(makeLog({ roastDate: "2025-06-01", tasting: null }));
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /豆/ })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("combobox", { name: /豆/ }));
    await user.click(await screen.findByRole("option", { name: BEAN.name }));
    const card = await screen.findByRole("button", { name: /2025-06-01/ });
    expect(card).toBeDisabled();
    await user.click(card);
    // radar placeholder should still show (not radar chart)
    expect(screen.queryByTestId("radar-chart")).not.toBeInTheDocument();
    expect(screen.getByText(/BestRecipe/)).toBeInTheDocument();
  });

  it("T1: 豆選択後、その Bean のログがカードとして表示される", async () => {
    await db.beans.put(BEAN);
    await db.roastLogs.put(makeLog({ roastDate: "2025-06-01" }));
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /豆/ })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("combobox", { name: /豆/ }));
    await user.click(await screen.findByRole("option", { name: BEAN.name }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /2025-06-01/ }),
      ).toBeInTheDocument(),
    );
  });

  it("T-LINE-3: X 軸の tick に小数文字列が存在しない", async () => {
    await db.beans.put(BEAN);
    await db.roastLogs.put(makeLog({ roastDate: "2025-06-01" }));
    await db.roastLogs.put(makeLog({ roastDate: "2025-07-01" }));
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /豆/ })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("combobox", { name: /豆/ }));
    await user.click(await screen.findByRole("option", { name: BEAN.name }));
    await waitFor(() =>
      expect(screen.getByTestId("line-chart")).toBeInTheDocument(),
    );
    const chart = screen.getByTestId("line-chart");
    const ticks = chart.querySelectorAll(
      ".nivo_bottom_axis text, [class*='axis'] text",
    );
    expect(ticks.length).toBeGreaterThan(0);
    for (const tick of ticks) {
      const text = tick.textContent ?? "";
      // 小数点を含む目盛りテキストが存在しないことを確認
      expect(text).not.toMatch(/\d+\.\d+/);
    }
  });

  it("T-LINE-4: データ点ホバー時にツールチップに % を含む文字列が表示される", async () => {
    await db.beans.put(BEAN);
    await db.roastLogs.put(
      makeLog({
        roastDate: "2025-06-01",
        weightBeforeG: 250,
        weightAfterG: 210,
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /豆/ })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("combobox", { name: /豆/ }));
    await user.click(await screen.findByRole("option", { name: BEAN.name }));
    await waitFor(() =>
      expect(screen.getByTestId("line-chart")).toBeInTheDocument(),
    );
    const chart = screen.getByTestId("line-chart");
    // nivo の useMesh モードでは透明な rect がホバー検知を担当する
    const meshRect =
      chart.querySelector(
        "rect[fill='transparent'], rect[style*='pointer-events'], rect:not([fill])",
      ) ?? chart.querySelector("rect");
    expect(meshRect).not.toBeNull();
    await user.hover(meshRect!);
    const tooltip = await screen.findByTestId("analysis-tooltip");
    expect(tooltip.textContent).toMatch(/%/);
  });

  it("T-LINE-5: データ点ホバー後、ツールチップに x: テキストが表示されない", async () => {
    await db.beans.put(BEAN);
    await db.roastLogs.put(
      makeLog({
        roastDate: "2025-06-01",
        weightBeforeG: 250,
        weightAfterG: 210,
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /豆/ })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("combobox", { name: /豆/ }));
    await user.click(await screen.findByRole("option", { name: BEAN.name }));
    await waitFor(() =>
      expect(screen.getByTestId("line-chart")).toBeInTheDocument(),
    );
    const chart = screen.getByTestId("line-chart");
    // nivo の useMesh モードでは透明な rect がホバー検知を担当する
    const meshRect =
      chart.querySelector(
        "rect[fill='transparent'], rect[style*='pointer-events'], rect:not([fill])",
      ) ?? chart.querySelector("rect");
    expect(meshRect).not.toBeNull();
    await user.hover(meshRect!);
    const tooltip = await screen.findByTestId("analysis-tooltip");
    expect(tooltip.textContent).toMatch(/%/);
    // x: ラベルがツールチップに含まれないことを確認
    expect(tooltip.textContent).not.toMatch(/^x:/);
    expect(tooltip.textContent).not.toMatch(/x:\s*\d/);
  });

  it("T-RADAR-3: レーダーチャートに6つの日本語ラベルが存在する", async () => {
    const log = makeLog({ tasting: TASTING, roastDate: "2025-06-01" });
    await db.beans.put({ ...BEAN, bestLogId: log.id });
    await db.roastLogs.put(log);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /豆/ })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("combobox", { name: /豆/ }));
    await user.click(await screen.findByRole("option", { name: BEAN.name }));
    await waitFor(() =>
      expect(screen.getByTestId("radar-chart")).toBeInTheDocument(),
    );
    const chart = screen.getByTestId("radar-chart");
    for (const label of ["甘み", "酸味", "コク", "苦み", "後味", "クリーン"]) {
      expect(chart.textContent).toContain(label);
    }
  });

  it("T-RADAR-4: ラベルを包む <g> の transform 属性値の Set サイズが 6 である", async () => {
    const log = makeLog({ tasting: TASTING, roastDate: "2025-06-01" });
    await db.beans.put({ ...BEAN, bestLogId: log.id });
    await db.roastLogs.put(log);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /豆/ })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("combobox", { name: /豆/ }));
    await user.click(await screen.findByRole("option", { name: BEAN.name }));
    await waitFor(() =>
      expect(screen.getByTestId("radar-chart")).toBeInTheDocument(),
    );
    const chart = screen.getByTestId("radar-chart");
    const labelTexts = ["甘み", "酸味", "コク", "苦み", "後味", "クリーン"];
    // gridLabel が出力する <g transform="translate(x, y)"> を直接探す
    // <g> の直接の子が <text> で、そのテキストが日本語ラベルであるものに絞る
    const labelGs = Array.from(
      chart.querySelectorAll("g[transform^='translate']"),
    ).filter((g) => {
      const children = Array.from(g.children);
      return children.some(
        (child) =>
          child.tagName === "text" &&
          labelTexts.includes(child.textContent ?? ""),
      );
    });
    const transformValues = new Set(
      labelGs.map((g) => g.getAttribute("transform") ?? ""),
    );
    expect(transformValues.size).toBe(6);
  });
});
