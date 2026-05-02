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
import { BeanCreatePage } from "@/components/BeanCreatePage";
import { db } from "@/db";

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const newRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/beans/new",
    component: BeanCreatePage,
  });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/beans/$beanId",
    component: () => <div data-testid="detail-page">detail</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([newRoute, detailRoute]),
    history: createMemoryHistory({ initialEntries: ["/beans/new"] }),
  });

  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("BeanCreatePage", () => {
  beforeEach(async () => {
    await db.beans.clear();
  });

  it("登録後、保存した Bean の詳細画面へ遷移する", async () => {
    const user = userEvent.setup();
    const router = renderPage();

    await waitFor(() =>
      expect(screen.getByLabelText("名前")).toBeInTheDocument(),
    );
    await user.type(screen.getByLabelText("名前"), "コスタリカ タラズ");
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() =>
      expect(router.state.location.pathname).toMatch(/^\/beans\/[\w-]+$/),
    );
    const stored = await db.beans.toArray();
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("コスタリカ タラズ");
    expect(router.state.location.pathname).toBe(`/beans/${stored[0].id}`);
  });
});
