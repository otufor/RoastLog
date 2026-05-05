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
import { BeanListPage } from "@/components/BeanListPage";
import { db } from "@/db";

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const beansIndexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/beans",
    component: BeanListPage,
  });
  const beansNewRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/beans/new",
    component: () => <div data-testid="new-page">new</div>,
  });
  const beanDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/beans/$beanId",
    component: () => <div data-testid="detail-page">detail</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      beansIndexRoute,
      beansNewRoute,
      beanDetailRoute,
    ]),
    history: createMemoryHistory({ initialEntries: ["/beans"] }),
  });

  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("BeanListPage", () => {
  beforeEach(async () => {
    await Promise.all([
      db.roastLevels.clear(),
      db.flavorTags.clear(),
      db.roastDevices.clear(),
      db.beans.clear(),
      db.roastLogs.clear(),
    ]);
  });

  it("生豆が 0 件のとき空状態メッセージが表示される", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("豆がありません")).toBeInTheDocument(),
    );
  });

  it("登録済み Bean が一覧に表示される（name, origin, stockG）", async () => {
    await db.beans.put({
      id: crypto.randomUUID(),
      name: "エチオピア イルガチェフェ",
      origin: "エチオピア",
      productName: "G1",
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
    });

    renderPage();
    await waitFor(() =>
      expect(screen.getByText("エチオピア イルガチェフェ")).toBeInTheDocument(),
    );
    expect(screen.getByText("エチオピア")).toBeInTheDocument();
    expect(screen.getByText(/残 100%/)).toBeInTheDocument();
  });

  it("「豆を追加」ボタンで /beans/new へ遷移する", async () => {
    const user = userEvent.setup();
    const router = renderPage();
    await waitFor(() =>
      expect(screen.getByText("豆がありません")).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "豆を追加" }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/beans/new"),
    );
  });

  it("カードをクリックすると詳細画面 /beans/$beanId に遷移する", async () => {
    const id = crypto.randomUUID();
    await db.beans.put({
      id,
      name: "ブラジル セラード",
      origin: "ブラジル",
      productName: "",
      shopName: "",
      purchasedAt: null,
      importedAt: null,
      stockG: 200,
      bestLogId: null,
      note: "",
      totalG: 0,
      flavorTagIds: [],
      process: "",
      region: "",
      altitude: "",
      variety: "",
    });

    const user = userEvent.setup();
    const router = renderPage();
    await waitFor(() =>
      expect(screen.getByText("ブラジル セラード")).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /ブラジル セラード/ }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/beans/${id}`),
    );
  });

  it("在庫切れ豆にバッジが表示される", async () => {
    await db.beans.put({
      id: crypto.randomUUID(),
      name: "ケニア ニエリ",
      origin: "ケニア",
      productName: "",
      shopName: "",
      purchasedAt: null,
      importedAt: null,
      stockG: 0,
      bestLogId: null,
      note: "",
      totalG: 300,
      flavorTagIds: [],
      process: "",
      region: "",
      altitude: "",
      variety: "",
    });

    renderPage();
    await waitFor(() =>
      expect(screen.getByText("ケニア ニエリ")).toBeInTheDocument(),
    );
    expect(screen.getByText("在庫切れ")).toBeInTheDocument();
  });
});
