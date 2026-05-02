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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("BeanDetailPage", () => {
  beforeEach(async () => {
    await db.beans.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("全フィールドと購入からの経過月数を表示する", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-05-02"));

    const id = crypto.randomUUID();
    await db.beans.put({
      id,
      name: "エチオピア イルガチェフェ",
      origin: "エチオピア",
      productName: "G1 ナチュラル",
      shopName: "丸山珈琲",
      purchasedAt: "2026-04-01",
      importedAt: "2026-02-15",
      stockG: 320,
      bestLogId: null,
      note: "フローラルで好み",
    });

    renderAt(id);

    await waitFor(() =>
      expect(screen.getByText("エチオピア イルガチェフェ")).toBeInTheDocument(),
    );
    expect(screen.getByText("エチオピア")).toBeInTheDocument();
    expect(screen.getByText("G1 ナチュラル")).toBeInTheDocument();
    expect(screen.getByText("丸山珈琲")).toBeInTheDocument();
    expect(screen.getByText("320g")).toBeInTheDocument();
    expect(screen.getByText("2026-04-01")).toBeInTheDocument();
    expect(screen.getByText("2026-02-15")).toBeInTheDocument();
    expect(screen.getByText("フローラルで好み")).toBeInTheDocument();
    // 経過月数: 購入日 2026-04-01, 今日固定 2026-05-02 → 1 ヶ月
    expect(screen.getByText(/1 ヶ月/)).toBeInTheDocument();
  });

  it("編集リンクで /beans/$beanId/edit に遷移できる", async () => {
    const id = crypto.randomUUID();
    await db.beans.put({
      id,
      name: "ブラジル",
      origin: "",
      productName: "",
      shopName: "",
      purchasedAt: null,
      importedAt: null,
      stockG: 100,
      bestLogId: null,
      note: "",
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
      id,
      name: "コロンビア",
      origin: "",
      productName: "",
      shopName: "",
      purchasedAt: null,
      importedAt: null,
      stockG: 100,
      bestLogId: null,
      note: "",
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
      id,
      name: "ケニア",
      origin: "",
      productName: "",
      shopName: "",
      purchasedAt: null,
      importedAt: null,
      stockG: 100,
      bestLogId: null,
      note: "",
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
});
