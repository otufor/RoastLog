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
import { RoastLogDetailPage } from "@/components/RoastLogDetailPage";
import { db } from "@/db";
import type { Bean } from "@/schemas/bean";
import type { FlavorTag, RoastDevice, RoastLevel } from "@/schemas/masterData";
import type { RoastLog } from "@/schemas/roastLog";

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

const FLAVOR_TAG: FlavorTag = {
  id: "tag-floral",
  name: "フローラル",
  color: "#F472B6",
};

const LOG: RoastLog = {
  id: "550e8400-e29b-41d4-a716-446655440099",
  beanId: BEAN.id,
  roastStartTime: "2025-04-20T00:00",
  roastLevelId: LEVEL.id,
  roastDeviceId: DEVICE.id,
  roastDurationSec: 480,
  firstCrackSec: 300,
  secondCrackSec: null,
  weightBeforeG: 250,
  weightAfterG: 210,
  outdoorTempC: null,
  outdoorHumidity: null,
  indoorTempC: 22,
  tempSource: "manual",
  weatherCode: null,
  tasting: null,
  overallScore: null,
  processNote: "テストメモ",
};

function renderDetailPage(logId: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/logs/$logId",
    component: () => <RoastLogDetailPage logId={logId} />,
  });
  const editRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/logs/$logId/edit",
    component: () => <div>編集ページ</div>,
  });
  const listRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/logs",
    component: () => <div>一覧ページ</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([detailRoute, editRoute, listRoute]),
    history: createMemoryHistory({ initialEntries: [`/logs/${logId}`] }),
  });

  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return router;
}

describe("RoastLogDetailPage", () => {
  beforeEach(async () => {
    await Promise.all([
      db.roastLevels.clear(),
      db.flavorTags.clear(),
      db.roastDevices.clear(),
      db.beans.clear(),
      db.roastLogs.clear(),
    ]);
  });

  it("豆名・焙煎日・焙煎度・焙煎機・WeightLossRate を表示する", async () => {
    await db.beans.put(BEAN);
    await db.roastLevels.put(LEVEL);
    await db.roastDevices.put(DEVICE);
    await db.roastLogs.put(LOG);

    renderDetailPage(LOG.id);

    await waitFor(() =>
      expect(screen.getByText("エチオピア イルガチェフェ")).toBeInTheDocument(),
    );
    expect(screen.getByText("2025-04-20")).toBeInTheDocument();
    expect(screen.getByText("中煎り")).toBeInTheDocument();
    expect(screen.getByText("手網")).toBeInTheDocument();
    expect(screen.getByText(/16\.0%/)).toBeInTheDocument();
  });

  it("processNote を表示する", async () => {
    await db.beans.put(BEAN);
    await db.roastLevels.put(LEVEL);
    await db.roastDevices.put(DEVICE);
    await db.roastLogs.put(LOG);

    renderDetailPage(LOG.id);

    await waitFor(() =>
      expect(screen.getByText("テストメモ")).toBeInTheDocument(),
    );
  });

  it("「編集」ボタンで編集ページへ遷移する", async () => {
    await db.beans.put(BEAN);
    await db.roastLevels.put(LEVEL);
    await db.roastDevices.put(DEVICE);
    await db.roastLogs.put(LOG);

    const router = renderDetailPage(LOG.id);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "編集" })).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("button", { name: "編集" }));

    await waitFor(() =>
      expect(router.state.location.pathname).toMatch(/\/edit$/),
    );
    expect(screen.getByText("編集ページ")).toBeInTheDocument();
  });

  it("tasting がある場合に 6 軸スコアとフレーバータグを表示する", async () => {
    const logWithTasting: RoastLog = {
      ...LOG,
      tasting: {
        flavorTags: [FLAVOR_TAG.id],
        sweetness: 4,
        acidity: 3,
        body: 3,
        bitterness: 2,
        aftertaste: 4,
        cleanliness: 5,
      },
      overallScore: 4,
    };
    await db.beans.put(BEAN);
    await db.roastLevels.put(LEVEL);
    await db.roastDevices.put(DEVICE);
    await db.flavorTags.put(FLAVOR_TAG);
    await db.roastLogs.put(logWithTasting);

    renderDetailPage(LOG.id);

    await waitFor(() =>
      expect(screen.getByText("テイスティング")).toBeInTheDocument(),
    );
    expect(screen.getByText("フローラル")).toBeInTheDocument();
    expect(screen.getByText("甘さ")).toBeInTheDocument();
    expect(screen.getByText("酸味")).toBeInTheDocument();
    expect(screen.getByText("コク")).toBeInTheDocument();
    expect(screen.getByText("苦み")).toBeInTheDocument();
    expect(screen.getByText("後味")).toBeInTheDocument();
    expect(screen.getByText("クリーン")).toBeInTheDocument();
    expect(screen.getByText("総合評価")).toBeInTheDocument();
  });

  it("tasting が null のとき「テイスティング」セクションを表示しない", async () => {
    await db.beans.put(BEAN);
    await db.roastLevels.put(LEVEL);
    await db.roastDevices.put(DEVICE);
    await db.roastLogs.put(LOG);

    renderDetailPage(LOG.id);

    await waitFor(() =>
      expect(screen.getByText("エチオピア イルガチェフェ")).toBeInTheDocument(),
    );
    expect(screen.queryByText("テイスティング")).not.toBeInTheDocument();
  });

  it("同じ Bean の直前ログが存在する場合に DiffSummary パネルを表示する", async () => {
    const previousLog: RoastLog = {
      ...LOG,
      id: "550e8400-e29b-41d4-a716-446655440098",
      roastStartTime: "2025-04-10T00:00",
      firstCrackSec: 280,
    };
    await db.beans.put(BEAN);
    await db.roastLevels.put(LEVEL);
    await db.roastDevices.put(DEVICE);
    await db.roastLogs.put(previousLog);
    await db.roastLogs.put(LOG);

    renderDetailPage(LOG.id);

    await waitFor(() =>
      expect(screen.getByText("前回ログとの差分")).toBeInTheDocument(),
    );
    expect(screen.getByText("前回焙煎日: 2025-04-10")).toBeInTheDocument();
  });

  it("Bean の最初のログ（直前ログなし）では DiffSummary パネルを表示しない", async () => {
    await db.beans.put(BEAN);
    await db.roastLevels.put(LEVEL);
    await db.roastDevices.put(DEVICE);
    await db.roastLogs.put(LOG);

    renderDetailPage(LOG.id);

    await waitFor(() =>
      expect(screen.getByText("エチオピア イルガチェフェ")).toBeInTheDocument(),
    );
    expect(screen.queryByText("前回ログとの差分")).not.toBeInTheDocument();
  });

  it("「BestRecipe に指定」ボタンをクリックすると bean.bestLogId が更新される", async () => {
    await db.beans.put(BEAN);
    await db.roastLevels.put(LEVEL);
    await db.roastDevices.put(DEVICE);
    await db.roastLogs.put(LOG);

    const user = userEvent.setup();
    renderDetailPage(LOG.id);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "BestRecipe に指定" }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "BestRecipe に指定" }));

    await waitFor(async () => {
      const stored = await db.beans.get(BEAN.id);
      expect(stored?.bestLogId).toBe(LOG.id);
    });
  });

  it("「削除」ボタンでログを削除し一覧へ遷移する", async () => {
    await db.beans.put(BEAN);
    await db.roastLevels.put(LEVEL);
    await db.roastDevices.put(DEVICE);
    await db.roastLogs.put(LOG);

    const router = renderDetailPage(LOG.id);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "削除" })).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("button", { name: "削除" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/logs"));
    expect(screen.getByText("一覧ページ")).toBeInTheDocument();
  });
});
