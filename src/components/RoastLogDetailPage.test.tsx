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
import type { RoastDevice, RoastLevel } from "@/schemas/masterData";
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

const LOG: RoastLog = {
  id: "550e8400-e29b-41d4-a716-446655440099",
  beanId: BEAN.id,
  roastDate: "2025-04-20",
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
