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
});
