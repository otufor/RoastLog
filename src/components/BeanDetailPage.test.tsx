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
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BeanDetailPage } from "@/components/BeanDetailPage";
import { db } from "@/db";

function renderAt(beanId: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/beans/$beanId",
    component: () => <BeanDetailPage beanId={beanId} />,
  });
  const beansListRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/beans",
    component: () => <div data-testid="list-page">list</div>,
  });
  const editRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/beans/$beanId/edit",
    component: () => <div data-testid="edit-page">edit</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([detailRoute, beansListRoute, editRoute]),
    history: createMemoryHistory({ initialEntries: [`/beans/${beanId}`] }),
  });

  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

const BASE_BEAN = {
  origin: "",
  productName: "",
  shopName: "",
  purchasedAt: null,
  importedAt: null,
  stockG: 100,
  bestLogId: null,
  note: "",
  totalG: 0,
  flavorTagIds: [] as string[],
  process: "",
  region: "",
  altitude: "",
  variety: "",
} as const;

describe("BeanDetailPage", () => {
  beforeEach(async () => {
    await Promise.all([
      db.roastLevels.clear(),
      db.flavorTags.clear(),
      db.roastDevices.clear(),
      db.beans.clear(),
      db.roastLogs.clear(),
    ]);
  });

  it("スペックグリッドと在庫を表示する", async () => {
    const id = crypto.randomUUID();
    await db.beans.put({
      ...BASE_BEAN,
      id,
      name: "エチオピア イルガチェフェ",
      origin: "エチオピア",
      region: "イルガチェフェ",
      process: "Washed",
      altitude: "1800m",
      variety: "Heirloom",
      shopName: "丸山珈琲",
      purchasedAt: "2026-04-01",
      stockG: 320,
      totalG: 400,
      note: "フローラルで好み",
    });

    renderAt(id);

    await waitFor(() =>
      expect(screen.getByText("エチオピア イルガチェフェ")).toBeInTheDocument(),
    );
    expect(screen.getByText("エチオピア")).toBeInTheDocument();
    expect(screen.getByText("イルガチェフェ")).toBeInTheDocument();
    expect(screen.getByText("Washed")).toBeInTheDocument();
    expect(screen.getByText("1800m")).toBeInTheDocument();
    expect(screen.getByText("Heirloom")).toBeInTheDocument();
    expect(screen.getByText("丸山珈琲")).toBeInTheDocument();
    expect(screen.getByText("2026-04-01")).toBeInTheDocument();
    expect(screen.getByText("フローラルで好み")).toBeInTheDocument();
    expect(screen.getByText("320")).toBeInTheDocument();
  });

  it("編集リンクで /beans/$beanId/edit に遷移できる", async () => {
    const id = crypto.randomUUID();
    await db.beans.put({
      ...BASE_BEAN,
      id,
      name: "ブラジル",
    });
    const user = userEvent.setup();
    const router = renderAt(id);

    await waitFor(() =>
      expect(screen.getByText("ブラジル")).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("link", { name: "編集" }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/beans/${id}/edit`),
    );
  });

  it("削除を確認すると /beans に遷移する", async () => {
    const id = crypto.randomUUID();
    await db.beans.put({
      ...BASE_BEAN,
      id,
      name: "コロンビア",
    });
    const user = userEvent.setup();
    const router = renderAt(id);
    await waitFor(() =>
      expect(screen.getByText("コロンビア")).toBeInTheDocument(),
    );

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "削除" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/beans"));
    expect(await db.beans.get(id)).toBeUndefined();
    confirmSpy.mockRestore();
  });

  it("削除をキャンセルするとそのまま留まる", async () => {
    const id = crypto.randomUUID();
    await db.beans.put({
      ...BASE_BEAN,
      id,
      name: "ケニア",
    });
    const user = userEvent.setup();
    const router = renderAt(id);
    await waitFor(() => expect(screen.getByText("ケニア")).toBeInTheDocument());

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    await user.click(screen.getByRole("button", { name: "削除" }));

    expect(router.state.location.pathname).toBe(`/beans/${id}`);
    expect(await db.beans.get(id)).toBeDefined();
    confirmSpy.mockRestore();
  });

  it("「在庫を更新」で増減モードが動作する", async () => {
    const id = crypto.randomUUID();
    await db.beans.put({
      ...BASE_BEAN,
      id,
      name: "グアテマラ",
      stockG: 200,
      totalG: 400,
    });

    const user = userEvent.setup();
    renderAt(id);

    await waitFor(() =>
      expect(screen.getByText("グアテマラ")).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "在庫を更新" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    await user.type(screen.getByLabelText(/増減量/), "-50");
    expect(screen.getByText("150g")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(async () => {
      const stored = await db.beans.get(id);
      expect(stored?.stockG).toBe(150);
    });
  });

  it("焙煎履歴がない場合「まだ焙煎していません」を表示する", async () => {
    const id = crypto.randomUUID();
    await db.beans.put({ ...BASE_BEAN, id, name: "パナマ" });

    renderAt(id);
    await waitFor(() => expect(screen.getByText("パナマ")).toBeInTheDocument());
    expect(screen.getByText("まだ焙煎していません")).toBeInTheDocument();
  });

  it("bestLogId が設定済みの場合、BestRecipe サマリーを表示する", async () => {
    const beanId = crypto.randomUUID();
    const logId = crypto.randomUUID();
    const levelId = "medium-001";

    await db.roastLevels.put({
      id: levelId,
      label: "中煎り",
      color: "#B06B1E",
      order: 3,
    });
    await db.roastDevices.put({
      id: "dev-1",
      name: "手網",
      method: "",
      note: "",
    });

    const log = {
      id: logId,
      beanId,
      roastStartTime: "2025-06-01T00:00",
      roastLevelId: levelId,
      roastDeviceId: "dev-1",
      roastDurationSec: 480,
      firstCrackSec: 300,
      secondCrackSec: null,
      weightBeforeG: 200,
      weightAfterG: 170,
      outdoorTempC: null,
      outdoorHumidity: null,
      indoorTempC: null,
      tempSource: "manual" as const,
      weatherCode: null,
      tasting: null,
      overallScore: 5,
      processNote: "",
    };

    await db.beans.put({
      ...BASE_BEAN,
      id: beanId,
      name: "エチオピア",
      bestLogId: logId,
    });
    await db.roastLogs.put(log);

    renderAt(beanId);
    await waitFor(() =>
      expect(screen.getByText("エチオピア")).toBeInTheDocument(),
    );

    expect(screen.getByText("BestRecipe")).toBeInTheDocument();
    expect(screen.getAllByText("2025-06-01").length).toBeGreaterThan(0);
    expect(screen.getAllByText("中煎り").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/15\.0%/).length).toBeGreaterThan(0);
  });

  it("bestLogId が null の場合、BestRecipe プレースホルダーを表示する", async () => {
    const id = crypto.randomUUID();
    await db.beans.put({
      ...BASE_BEAN,
      id,
      name: "コスタリカ",
      bestLogId: null,
    });

    renderAt(id);
    await waitFor(() =>
      expect(screen.getByText("コスタリカ")).toBeInTheDocument(),
    );

    expect(screen.getByText("BestRecipe")).toBeInTheDocument();
    expect(screen.getByText("まだ指定されていません")).toBeInTheDocument();
  });

  it("bestLogId が null でも最高スコアのログがあれば候補として「指定」ボタンを表示する", async () => {
    const beanId = crypto.randomUUID();
    const logId = crypto.randomUUID();
    const levelId = "light-001";

    await db.roastLevels.put({
      id: levelId,
      label: "浅煎り",
      color: "#C8A97E",
      order: 1,
    });
    await db.roastDevices.put({
      id: "dev-2",
      name: "手網",
      method: "",
      note: "",
    });

    await db.beans.put({
      ...BASE_BEAN,
      id: beanId,
      name: "ブラジル",
      bestLogId: null,
    });
    await db.roastLogs.put({
      id: logId,
      beanId,
      roastStartTime: "2025-07-10T00:00",
      roastLevelId: levelId,
      roastDeviceId: "dev-2",
      roastDurationSec: 600,
      firstCrackSec: 320,
      secondCrackSec: null,
      weightBeforeG: 300,
      weightAfterG: 255,
      outdoorTempC: null,
      outdoorHumidity: null,
      indoorTempC: null,
      tempSource: "manual" as const,
      weatherCode: null,
      tasting: null,
      overallScore: 4,
      processNote: "",
    });

    const user = userEvent.setup();
    renderAt(beanId);

    await waitFor(() =>
      expect(screen.getByText("ブラジル")).toBeInTheDocument(),
    );

    expect(
      screen.getByRole("button", { name: "BestRecipe に指定" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "BestRecipe に指定" }));

    await waitFor(async () => {
      const stored = await db.beans.get(beanId);
      expect(stored?.bestLogId).toBe(logId);
    });
  });
});
