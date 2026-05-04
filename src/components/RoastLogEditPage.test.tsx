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
import { RoastLogEditPage } from "@/components/RoastLogEditPage";
import { db } from "@/db";
import type { Bean } from "@/schemas/bean";
import type { RoastLevel } from "@/schemas/masterData";
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

const LOG: RoastLog = {
  id: "550e8400-e29b-41d4-a716-446655440099",
  beanId: BEAN.id,
  roastDate: "2025-04-20",
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

function renderEditPage(logId: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const editRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/logs/$logId/edit",
    component: () => <RoastLogEditPage logId={logId} />,
  });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/logs/$logId",
    component: () => <div>詳細ページ</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([editRoute, detailRoute]),
    history: createMemoryHistory({ initialEntries: [`/logs/${logId}/edit`] }),
  });

  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return router;
}

describe("RoastLogEditPage", () => {
  beforeEach(async () => {
    await Promise.all([
      db.roastLevels.clear(),
      db.flavorTags.clear(),
      db.roastDevices.clear(),
      db.beans.clear(),
      db.roastLogs.clear(),
    ]);
  });

  it("既存の weightBeforeG を初期値として表示する", async () => {
    await db.beans.put(BEAN);
    await db.roastLevels.put(LEVEL);
    await db.roastLogs.put(LOG);

    renderEditPage(LOG.id);

    await waitFor(() => {
      const input = screen.getByLabelText<HTMLInputElement>("焙煎前重量 (g)");
      expect(input.value).toBe("250");
    });
  });

  it("編集保存後に詳細ページへ遷移し、在庫は変動しない", async () => {
    await db.beans.put(BEAN);
    await db.roastLevels.put(LEVEL);
    await db.roastLogs.put(LOG);

    const router = renderEditPage(LOG.id);

    await waitFor(() =>
      expect(screen.getByLabelText("焙煎前重量 (g)")).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() =>
      expect(screen.getByText("詳細ページ")).toBeInTheDocument(),
    );

    expect(router.state.location.pathname).not.toMatch(/\/edit$/);

    const bean = await db.beans.get(BEAN.id);
    expect(bean?.stockG).toBe(500);
  });
});
