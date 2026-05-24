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
import { RoastLogCreatePage } from "@/components/RoastLogCreatePage";
import { db } from "@/db";
import type { Bean } from "@/schemas/bean";
import type { RoastLevel } from "@/schemas/masterData";

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

const LOG_DETAIL_PATH = "/logs/$logId";

function renderCreatePage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const createRoute_ = createRoute({
    getParentRoute: () => rootRoute,
    path: "/logs/new",
    component: RoastLogCreatePage,
  });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: LOG_DETAIL_PATH,
    component: () => <div>詳細ページ</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([createRoute_, detailRoute]),
    history: createMemoryHistory({ initialEntries: ["/logs/new"] }),
  });

  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { router };
}

describe("RoastLogCreatePage", () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await Promise.all([
      db.roastLevels.clear(),
      db.flavorTags.clear(),
      db.roastDevices.clear(),
      db.beans.clear(),
      db.roastLogs.clear(),
    ]);
  });

  it("フォームのタイトル「新しい焙煎を記録」を表示する", async () => {
    renderCreatePage();
    await waitFor(() =>
      expect(screen.getByText("新しい焙煎を記録")).toBeInTheDocument(),
    );
  });

  it("在庫不足の場合、確認ダイアログを表示する", async () => {
    await db.beans.put({ ...BEAN, stockG: 100 });
    await db.roastLevels.put(LEVEL);

    renderCreatePage();

    await waitFor(() =>
      expect(screen.getByLabelText("焙煎前重量 (g)")).toBeInTheDocument(),
    );

    const beforeInput = screen.getByLabelText("焙煎前重量 (g)");
    const afterInput = screen.getByLabelText("焙煎後重量 (g)");
    await userEvent.clear(beforeInput);
    await userEvent.type(beforeInput, "200");
    await userEvent.clear(afterInput);
    await userEvent.type(afterInput, "170");

    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() =>
      expect(
        screen.getByRole("dialog", { name: "在庫不足の確認" }),
      ).toBeInTheDocument(),
    );
  });

  it("在庫不足ダイアログでキャンセルすると保存しない", async () => {
    await db.beans.put({ ...BEAN, stockG: 100 });
    await db.roastLevels.put(LEVEL);

    const { router } = renderCreatePage();

    await waitFor(() =>
      expect(screen.getByLabelText("焙煎前重量 (g)")).toBeInTheDocument(),
    );

    const beforeInput = screen.getByLabelText("焙煎前重量 (g)");
    const afterInput = screen.getByLabelText("焙煎後重量 (g)");
    await userEvent.clear(beforeInput);
    await userEvent.type(beforeInput, "200");
    await userEvent.clear(afterInput);
    await userEvent.type(afterInput, "170");

    await userEvent.click(screen.getByRole("button", { name: "登録" }));
    await waitFor(() =>
      expect(
        screen.getByRole("dialog", { name: "在庫不足の確認" }),
      ).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "在庫不足の確認" }),
      ).not.toBeInTheDocument(),
    );
    expect(router.state.location.pathname).toBe("/logs/new");
  });

  it("在庫不足ダイアログで「それでも保存」すると保存して詳細ページへ遷移する", async () => {
    await db.beans.put({ ...BEAN, stockG: 100 });
    await db.roastLevels.put(LEVEL);

    const { router } = renderCreatePage();

    await waitFor(() =>
      expect(screen.getByLabelText("焙煎前重量 (g)")).toBeInTheDocument(),
    );

    const beforeInput = screen.getByLabelText("焙煎前重量 (g)");
    const afterInput = screen.getByLabelText("焙煎後重量 (g)");
    await userEvent.clear(beforeInput);
    await userEvent.type(beforeInput, "200");
    await userEvent.clear(afterInput);
    await userEvent.type(afterInput, "170");

    await userEvent.click(screen.getByRole("button", { name: "登録" }));
    await waitFor(() =>
      expect(
        screen.getByRole("dialog", { name: "在庫不足の確認" }),
      ).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("button", { name: "それでも保存" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/logs\/.+$/);
      expect(screen.getByText("詳細ページ")).toBeInTheDocument();
    });
  });

  it("保存後に詳細ページへ遷移する", async () => {
    await db.beans.put(BEAN);
    await db.roastLevels.put(LEVEL);

    const { router } = renderCreatePage();

    await waitFor(() =>
      expect(screen.getByLabelText("焙煎前重量 (g)")).toBeInTheDocument(),
    );

    const beforeInput = screen.getByLabelText("焙煎前重量 (g)");
    const afterInput = screen.getByLabelText("焙煎後重量 (g)");
    await userEvent.clear(beforeInput);
    await userEvent.type(beforeInput, "250");
    await userEvent.clear(afterInput);
    await userEvent.type(afterInput, "210");

    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/logs\/.+$/);
      expect(screen.getByText("詳細ページ")).toBeInTheDocument();
    });
  });
});
