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
import { RoastLogListPage } from "@/components/RoastLogListPage";
import { db } from "@/db";
import type { Bean } from "@/schemas/bean";
import type { RoastLevel } from "@/schemas/masterData";
import type { RoastLog } from "@/schemas/roastLog";

const BEAN_ID = "550e8400-e29b-41d4-a716-446655440001";
const LEVEL_ID = "medium";

const SAMPLE_BEAN: Bean = {
  id: BEAN_ID,
  name: "エチオピア イルガチェフェ",
  origin: "エチオピア",
  productName: "",
  shopName: "",
  purchasedAt: null,
  importedAt: null,
  stockG: 500,
  bestLogId: null,
  note: "",
};

const SAMPLE_LEVEL: RoastLevel = {
  id: LEVEL_ID,
  label: "中煎り",
  color: "#B06B1E",
  order: 3,
};

const makeLog = (overrides: Partial<RoastLog> = {}): RoastLog => ({
  id: crypto.randomUUID(),
  beanId: BEAN_ID,
  roastDate: "2025-04-20",
  roastLevelId: LEVEL_ID,
  roastDeviceId: null,
  roastDurationSec: 480,
  firstCrackSec: 300,
  secondCrackSec: null,
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
  ...overrides,
});

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const logsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/logs",
    component: RoastLogListPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([logsRoute]),
    history: createMemoryHistory({ initialEntries: ["/logs"] }),
  });

  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("RoastLogListPage", () => {
  beforeEach(async () => {
    await Promise.all([
      db.roastLevels.clear(),
      db.flavorTags.clear(),
      db.roastDevices.clear(),
      db.beans.clear(),
      db.roastLogs.clear(),
    ]);
  });

  it("ログが 0 件のとき「焙煎ログがありません」を表示する", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("焙煎ログがありません")).toBeInTheDocument(),
    );
  });

  it("ログの豆名・焙煎日・減少率が表示される", async () => {
    await db.beans.put(SAMPLE_BEAN);
    await db.roastLevels.put(SAMPLE_LEVEL);
    await db.roastLogs.put(makeLog());

    renderPage();

    await waitFor(() =>
      expect(screen.getByText("エチオピア イルガチェフェ")).toBeInTheDocument(),
    );
    // 重量減少率: (1 - 210/250) × 100 = 16.0%
    expect(screen.getByText(/16\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/2025-04-20/)).toBeInTheDocument();
  });

  it("焙煎度バッジ「中煎り」が表示される", async () => {
    await db.beans.put(SAMPLE_BEAN);
    await db.roastLevels.put(SAMPLE_LEVEL);
    await db.roastLogs.put(makeLog());

    renderPage();

    await waitFor(() => expect(screen.getByText("中煎り")).toBeInTheDocument());
  });

  it("cleanliness が 2 のとき「要確認」バッジと危険ボーダーを表示する", async () => {
    await db.beans.put(SAMPLE_BEAN);
    await db.roastLevels.put(SAMPLE_LEVEL);
    await db.roastLogs.put(
      makeLog({
        tasting: {
          flavorTags: [],
          sweetness: 3,
          acidity: 3,
          body: 3,
          bitterness: 3,
          aftertaste: 3,
          cleanliness: 2,
        },
      }),
    );

    renderPage();

    await waitFor(() => expect(screen.getByText("要確認")).toBeInTheDocument());
    // 要確認のときは焙煎度バッジは表示しない
    expect(screen.queryByText("中煎り")).not.toBeInTheDocument();
  });

  it("Bean.bestLogId が一致するとき「ベスト」バッジを表示する", async () => {
    const log = makeLog();
    await db.beans.put({ ...SAMPLE_BEAN, bestLogId: log.id });
    await db.roastLevels.put(SAMPLE_LEVEL);
    await db.roastLogs.put(log);

    renderPage();

    await waitFor(() => expect(screen.getByText("ベスト")).toBeInTheDocument());
  });

  it("複数ログを日付降順で並べる", async () => {
    await db.beans.put(SAMPLE_BEAN);
    await db.roastLevels.put(SAMPLE_LEVEL);
    const logOld = makeLog({ roastDate: "2025-04-03" });
    const logNew = makeLog({ roastDate: "2025-04-20" });
    await db.roastLogs.put(logOld);
    await db.roastLogs.put(logNew);

    renderPage();

    await waitFor(() =>
      expect(screen.getAllByText(/2025-04-/)).toHaveLength(2),
    );

    const dates = screen
      .getAllByText(/2025-04-/)
      .map((el) => el.textContent ?? "");
    expect(dates[0]).toMatch("2025-04-20");
    expect(dates[1]).toMatch("2025-04-03");
  });

  it("フィルターチップをクリックするとアクティブ状態になる", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("焙煎ログがありません")).toBeInTheDocument(),
    );

    const user = userEvent.setup();
    const chipBean = screen.getByRole("button", { name: /豆/ });
    await user.click(chipBean);

    expect(chipBean).toHaveAttribute("aria-pressed", "true");
  });
});
